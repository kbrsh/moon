/*
* Moon v0.8.0
* Copyright 2016-2017, Kabir Shah
* https://github.com/KingPixil/moon/
* Free to use under the MIT license.
* https://kingpixil.github.io/license
*/

(function(root, factory) {
  /* ======= Global Moon ======= */
  (typeof module === "object" && module.exports) ? module.exports = factory() : root.Moon = factory();
}(this, function() {
    "use strict";
    
    /* ======= Global Variables ======= */
    
    var directives = {};
    var specialDirectives = {};
    var components = {};
    var eventModifiersCode = {
      stop: 'event.stopPropagation();',
      prevent: 'event.preventDefault();',
      ctrl: 'if(!event.ctrlKey) {return;};',
      shift: 'if(!event.shiftKey) {return;};',
      alt: 'if(!event.altKey) {return;};',
      enter: 'if(event.keyCode !== 13) {return;};'
    };
    var id = 0;
    
    /* ======= Observer ======= */
    /**
     * Makes Computed Properties for an Instance
     * @param {Object} instance
     * @param {Object} computed
     */
    var initComputed = function (instance, computed) {
      var setComputedProperty = function (prop) {
        // Flush Cache if Dependencies Change
        instance.$observer.observe(prop);
    
        // Create Getters/Setters
        var properties = {
          get: function () {
            // Property Cache
            var cache = null;
    
            // If no cache, create it
            if (!instance.$observer.cache[prop]) {
              // Capture Dependencies
              instance.$observer.dep.target = prop;
              // Invoke getter
              cache = computed[prop].get.call(instance);
              // Stop Capturing Dependencies
              instance.$observer.dep.target = null;
              // Store value in cache
              instance.$observer.cache[prop] = cache;
            } else {
              // Cache found, use it
              cache = instance.$observer.cache[prop];
            }
    
            return cache;
          }
        };
    
        if (computed[prop].set) {
          properties.set = function (val) {
            return computed[prop].set.call(instance, val);
          };
        }
    
        // Add Getters/Setters
        Object.defineProperty(instance.$data, prop, properties);
      };
    
      // Set All Computed Properties
      for (var propName in computed) {
        setComputedProperty(propName);
      }
    };
    
    function Observer(instance) {
      this.instance = instance;
      this.cache = {};
      this.signals = {};
      this.dep = {
        target: null,
        map: {}
      };
    }
    
    Observer.prototype.observe = function (key) {
      var self = this;
      this.signals[key] = function () {
        self.cache[key] = null;
      };
    };
    
    Observer.prototype.notify = function (key) {
      if (this.dep.map[key]) {
        for (var i = 0; i < this.dep.map[key].length; i++) {
          this.notify(this.dep.map[key][i]);
        }
      }
    
      if (!this.signals[key]) {
        return;
      }
    
      this.signals[key]();
    };
    
    /* ======= Global Utilities ======= */
    
    /**
     * Logs a Message
     * @param {String} msg
     */
    var log = function (msg) {
      if (!Moon.config.silent) console.log(msg);
    };
    
    /**
     * Throws an Error
     * @param {String} msg
     */
    var error = function (msg) {
      if (!Moon.config.silent) console.error("[Moon] ERR: " + msg);
    };
    
    /**
     * Adds DOM Updates to Queue
     * @param {Object} instance
     */
    var queueBuild = function (instance) {
      if (!instance.$queued && !instance.$destroyed) {
        instance.$queued = true;
        setTimeout(function () {
          instance.build();
          callHook(instance, 'updated');
          instance.$queued = false;
        }, 0);
      }
    };
    
    /**
     * Gives Default Metadata for a VNode
     * @return {Object} metadata
     */
    var defaultMetadata = function () {
      return {
        shouldRender: false,
        eventListeners: {}
      };
    };
    
    /**
     * Escapes a String
     * @param {String} str
     */
    var escapeString = function (str) {
      var NEWLINE_RE = /\n/g;
      var DOUBLE_QUOTE_RE = /"/g;
      var BACKSLASH_RE = /\\/g;
      return str.replace(BACKSLASH_RE, "\\\\").replace(DOUBLE_QUOTE_RE, "\\\"").replace(NEWLINE_RE, "\\n");
    };
    
    /**
     * Resolves an Object Keypath and Sets it
     * @param {Object} instance
     * @param {Object} obj
     * @param {String} keypath
     * @param {String} val
     * @return {Object} resolved object
     */
    var resolveKeyPath = function (instance, obj, keypath, val) {
      var i = null;
      keypath.replace(/\[(\w+)\]/g, function (match, index) {
        keypath = keypath.replace(match, '.' + index);
      });
      var path = keypath.split(".");
      for (i = 0; i < path.length - 1; i++) {
        var propName = path[i];
        obj = obj[propName];
      }
      obj[path[i]] = val;
      return path[0];
    };
    
    /**
     * Extracts the Slots From Component Children
     * @param {Array} children
     * @return {Object} extracted slots
     */
    var getSlots = function (children) {
      var slots = {};
    
      // No Children Means No Slots
      if (!children) {
        return slots;
      }
    
      var defaultSlotName = "default";
      slots[defaultSlotName] = [];
    
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var childProps = child.props.attrs;
        if (childProps.slot) {
          if (!slots[childProps.slot]) {
            slots[childProps.slot] = [child];
          } else {
            slots[childProps.slot].push(child);
          }
          delete childProps.slot;
        } else {
          slots[defaultSlotName].push(child);
        }
      }
    
      return slots;
    };
    
    /**
     * Extends an Object with another Object's properties
     * @param {Object} parent
     * @param {Object} child
     * @return {Object} Extended Parent
     */
    var extend = function (parent, child) {
      for (var key in child) {
        parent[key] = child[key];
      }
      return parent;
    };
    
    /**
     * Merges Two Objects Together
     * @param {Object} parent
     * @param {Object} child
     * @return {Object} Merged Object
     */
    var merge = function (parent, child) {
      var merged = {};
      for (var key in parent) {
        merged[key] = parent[key];
      }
      for (var key in child) {
        merged[key] = child[key];
      }
      return merged;
    };
    
    /**
     * Calls a Hook
     * @param {Object} instance
     * @param {String} name
     */
    var callHook = function (instance, name) {
      var hook = instance.$hooks[name];
      if (hook) {
        hook.call(instance);
      }
    };
    
    /**
     * Does No Operation
     */
    var noop = function () {};
    
    /**
     * Converts attributes into key-value pairs
     * @param {Node} node
     * @return {Object} Key-Value pairs of Attributes
     */
    var extractAttrs = function (node) {
      var attrs = {};
      for (var rawAttrs = node.attributes, i = rawAttrs.length; i--;) {
        attrs[rawAttrs[i].name] = rawAttrs[i].value;
      }
      return attrs;
    };
    
    /**
     * Adds metadata Event Listeners to an Element
     * @param {Object} node
     * @param {Object} vnode
     * @param {Object} instance
     */
    var addEventListeners = function (node, vnode, instance) {
      var eventListeners = vnode.meta.eventListeners;
      for (var type in eventListeners) {
        for (var i = 0; i < eventListeners[type].length; i++) {
          var method = eventListeners[type][i];
          node.addEventListener(type, method);
        }
      }
    };
    
    /**
     * Creates DOM Node from VNode
     * @param {Object} vnode
     * @param {Object} instance
     * @return {Object} DOM Node
     */
    var createNodeFromVNode = function (vnode, instance) {
      var el = null;
    
      if (vnode.type === "#text") {
        // Create textnode
        el = document.createTextNode(vnode.val);
      } else {
        el = vnode.meta.isSVG ? document.createElementNS('http://www.w3.org/2000/svg', vnode.type) : document.createElement(vnode.type);
        // Optimization: VNode only has one child that is text, and create it here
        if (vnode.children.length === 1 && vnode.children[0].type === "#text") {
          el.textContent = vnode.children[0].val;
          vnode.children[0].meta.el = el.firstChild;
        } else {
          // Add all children
          for (var i = 0; i < vnode.children.length; i++) {
            var childVNode = vnode.children[i];
            var childNode = createNodeFromVNode(vnode.children[i], instance);
            el.appendChild(childNode);
            // Component detected, mount it here
            if (childVNode.meta.component) {
              createComponentFromVNode(childNode, childVNode, childVNode.meta.component);
            }
          }
        }
        // Add all event listeners
        addEventListeners(el, vnode, instance);
      }
      // Setup Props
      diffProps(el, {}, vnode, vnode.props.attrs);
    
      // Hydrate
      vnode.meta.el = el;
    
      return el;
    };
    
    /**
     * Appends a Child, Ensuring Components are Mounted
     * @param {Object} node
     * @param {Object} vnode
     * @param {Object} parent
     */
    var appendChild = function (node, vnode, parent) {
      // Remove the node
      parent.appendChild(node);
    
      // Check for Component
      if (vnode.meta.component) {
        createComponentFromVNode(node, vnode, vnode.meta.component);
      }
    };
    
    /**
     * Removes a Child, Ensuring Components are Unmounted
     * @param {Object} node
     * @param {Object} parent
     */
    var removeChild = function (node, parent) {
      // Check for Component
      if (node.__moon__) {
        // Component was unmounted, destroy it here
        node.__moon__.destroy();
      }
    
      // Remove the Node
      parent.removeChild(node);
    };
    
    /**
     * Replaces a Child, Ensuring Components are Unmounted/Mounted
     * @param {Object} oldNode
     * @param {Object} newNode
     * @param {Object} vnode
     * @param {Object} parent
     */
    var replaceChild = function (oldNode, newNode, vnode, parent) {
      // Check for Component
      if (oldNode.__moon__) {
        // Component was unmounted, destroy it here
        oldNode.__moon__.destroy();
      }
    
      // Replace It
      parent.replaceChild(newNode, oldNode);
    
      // Check for Component
      if (vnode.meta.component) {
        createComponentFromVNode(newNode, vnode, vnode.meta.component);
      }
    };
    
    /**
     * Patch Types
     */
    var PATCH = {
      SKIP: 0,
      APPEND: 1,
      REMOVE: 2,
      REPLACE: 3,
      TEXT: 4,
      CHILDREN: 5
    };
    
    /**
     * Creates a Virtual DOM Node
     * @param {String} type
     * @param {String} val
     * @param {Object} props
     * @param {Object} meta
     * @param {Array} children
     * @return {Object} Virtual DOM Node
     */
    var createElement = function (type, val, props, meta, children) {
      return {
        type: type,
        val: val,
        props: props,
        children: children,
        meta: meta || defaultMetadata()
      };
    };
    
    /**
     * Creates a Functional Component
     * @param {Object} props
     * @param {Array} children
     * @param {Object} functionalComponent
     * @return {Object} Virtual DOM Node
     */
    var createFunctionalComponent = function (props, children, functionalComponent) {
      var data = functionalComponent.opts.data || {};
      // Merge data with provided props
      if (functionalComponent.opts.props) {
        for (var i = 0; i < functionalComponent.opts.props.length; i++) {
          var prop = functionalComponent.opts.props[i];
          data[prop] = props.attrs[prop];
        }
      }
      return functionalComponent.opts.render(h, {
        data: data,
        slots: getSlots(children)
      });
    };
    
    /**
     * Compiles Arguments to a VNode
     * @param {String} tag
     * @param {Object} attrs
     * @param {Object} meta
     * @param {Object|String} children
     * @return {Object} Object usable in Virtual DOM (VNode)
     */
    var h = function (tag, attrs, meta, children) {
      // Text Node
      if (tag === "#text") {
        // Tag => #text
        // Attrs => meta
        // Meta => val
        return createElement("#text", meta, { attrs: {} }, attrs, []);
      }
    
      // It's a Component
      if (components[tag]) {
        // Functional component
        if (components[tag].opts.functional) {
          return createFunctionalComponent(attrs, children, components[tag]);
        } else {
          // Provide the instance to diff engine
          meta.component = components[tag];
        }
      }
    
      // In the end, we have a VNode structure like:
      // {
      //  type: 'h1', <= nodename
      //  props: {
      //    attrs: {id: 'someId'}, <= regular attributes
      //    dom: {textContent: 'some text content'} <= only for DOM properties added by directives
      //  },
      //  meta: {}, <= metadata used internally
      //  children: [], <= any child nodes or text
      // }
    
      return createElement(tag, "", attrs, meta, children);
    };
    
    /**
     * Mounts a Component To The DOM
     * @param {Object} node
     * @param {Object} vnode
     * @param {Object} component
     * @return {Object} DOM Node
     */
    var createComponentFromVNode = function (node, vnode, component) {
      var componentInstance = new component.CTor();
      // Merge data with provided props
      for (var i = 0; i < componentInstance.$props.length; i++) {
        var prop = componentInstance.$props[i];
        componentInstance.$data[prop] = vnode.props.attrs[prop];
      }
      componentInstance.$slots = getSlots(vnode.children);
      componentInstance.$el = node;
      componentInstance.build();
      callHook(componentInstance, 'mounted');
    
      // Rehydrate
      vnode.meta.el = componentInstance.$el;
    
      return componentInstance.$el;
    };
    
    /**
     * Diffs Props of Node and a VNode, and apply Changes
     * @param {Object} node
     * @param {Object} nodeProps
     * @param {Object} vnode
     */
    var diffProps = function (node, nodeProps, vnode) {
      // Get VNode Attributes
      var vnodeProps = vnode.props.attrs;
    
      // If node is svg, update with SVG namespace
      var isSVG = vnode.meta.isSVG;
    
      // Diff VNode Props with Node Props
      if (vnodeProps) {
        for (var vnodePropName in vnodeProps) {
          var vnodePropValue = vnodeProps[vnodePropName];
          var nodePropValue = nodeProps[vnodePropName];
    
          if (nodePropValue == null || vnodePropValue !== nodePropValue) {
            isSVG ? node.setAttributeNS(null, vnodePropName, vnodePropValue) : node.setAttribute(vnodePropName, vnodePropValue);
          }
        }
      }
    
      // Diff Node Props with VNode Props
      if (nodeProps) {
        for (var nodePropName in nodeProps) {
          var vnodePropValue = vnodeProps[nodePropName];
          var nodePropValue = nodeProps[nodePropName];
    
          if (vnodePropValue == null || directives[nodePropName]) {
            if (directives[nodePropName]) {
              directives[nodePropName](node, vnodePropValue, vnode);
            }
            isSVG ? node.removeAttributeNS(null, nodePropName) : node.removeAttribute(nodePropName);
          }
        }
      }
    
      // Add/Update any DOM Props
      if (vnode.props.dom) {
        for (var domProp in vnode.props.dom) {
          var domPropValue = vnode.props.dom[domProp];
          if (node[domProp] !== domPropValue) {
            node[domProp] = domPropValue;
          }
        }
      }
    };
    
    /**
     * Diffs a Component
     * @param {Object} node
     * @param {Object} vnode
     * @return {Object} adjusted node only if it was replaced
     */
    var diffComponent = function (node, vnode) {
      if (!node.__moon__) {
        // Not mounted, create a new instance and mount it here
        createComponentFromVNode(node, vnode, vnode.meta.component);
      } else {
        // Mounted already, need to update
        var componentInstance = node.__moon__;
        var componentChanged = false;
        // Merge any properties that changed
        for (var i = 0; i < componentInstance.$props.length; i++) {
          var prop = componentInstance.$props[i];
          if (componentInstance.$data[prop] !== vnode.props.attrs[prop]) {
            componentInstance.$data[prop] = vnode.props.attrs[prop];
            componentChanged = true;
          }
        }
        // If it has children, resolve any new slots
        if (vnode.children) {
          componentInstance.$slots = getSlots(vnode.children);
          componentChanged = true;
        }
        // If any changes were detected, build the component
        if (componentChanged) {
          componentInstance.build();
        }
      }
    };
    
    /**
     * Hydrates Node and a VNode
     * @param {Object} node
     * @param {Object} vnode
     * @param {Object} parent
     * @param {Object} instance
     * @return {Object} adjusted node only if it was replaced
     */
    var hydrate = function (node, vnode, parent, instance) {
      var nodeName = node ? node.nodeName.toLowerCase() : null;
    
      if (!node) {
        // No node, create one
        var newNode = createNodeFromVNode(vnode, instance);
        appendChild(newNode, vnode, parent);
    
        return newNode;
      } else if (!vnode) {
        removeChild(node, parent);
    
        return null;
      } else if (nodeName !== vnode.type) {
        var newNode = createNodeFromVNode(vnode, instance);
        replaceChild(node, newNode, vnode, parent);
        return newNode;
      } else if (vnode.type === "#text") {
        if (node && nodeName === "#text") {
          // Both are textnodes, update the node
          if (node.textContent !== vnode.val) {
            node.textContent = vnode.val;
          }
    
          // Hydrate
          vnode.meta.el = node;
        } else {
          // Node isn't text, replace with one
          replaceChild(node, createNodeFromVNode(vnode, instance), vnode, parent);
        }
    
        return node;
      } else {
        // Hydrate
        vnode.meta.el = node;
    
        // Check for Component
        if (vnode.meta.component) {
          // Diff the Component
          diffComponent(node, vnode);
    
          // Skip diffing any children
          return node;
        }
    
        // Diff props
        diffProps(node, extractAttrs(node), vnode);
    
        // Add event listeners
        addEventListeners(node, vnode, instance);
    
        // Check if innerHTML was changed, and don't diff children if so
        if (vnode.props.dom && vnode.props.dom.innerHTML) {
          return node;
        }
    
        // Hydrate Children
        var i = 0;
        var currentChildNode = node.firstChild;
        var vchild = vnode.children[i];
        while (vchild || currentChildNode) {
          hydrate(currentChildNode, vchild, node, instance);
          vchild = vnode.children[++i];
          currentChildNode = currentChildNode ? currentChildNode.nextSibling : null;
        }
    
        return node;
      }
    };
    
    /**
     * Diffs Node and a VNode, and applies Changes
     * @param {Object} node
     * @param {Object} vnode
     * @param {Object} parent
     * @param {Object} instance
     * @return {Number} patch type
     */
    var diff = function (oldVNode, vnode, parent, instance) {
      if (oldVNode === vnode) {
        // Both have the same reference, exit early
        return PATCH.SKIP;
      } else if (!oldVNode) {
        // No Node, append a node
        appendChild(createNodeFromVNode(vnode, instance), vnode, parent);
    
        return PATCH.APPEND;
      } else if (!vnode) {
        // No New VNode, remove Node
        removeChild(oldVNode.meta.el, parent);
    
        return PATCH.REMOVE;
      } else if (oldVNode.type !== vnode.type) {
        // Different types, replace it
        replaceChild(oldVNode.meta.el, createNodeFromVNode(vnode, instance), vnode, parent);
    
        return PATCH.REPLACE;
      } else if (vnode.meta.shouldRender && vnode.type === "#text") {
        var node = oldVNode.meta.el;
    
        if (oldVNode.type === "#text") {
          // Both are textnodes, update the node
          if (vnode.val !== oldVNode.val) {
            node.textContent = vnode.val;
          }
    
          return PATCH.TEXT;
        } else {
          // Node isn't text, replace with one
          replaceChild(node, createNodeFromVNode(vnode, instance), vnode, parent);
          return PATCH.REPLACE;
        }
      } else if (vnode.meta.shouldRender) {
        var _node = oldVNode.meta.el;
    
        // Check for Component
        if (vnode.meta.component) {
          // Diff Component
          diffComponent(_node, vnode);
    
          // Skip diffing any children
          return PATCH.SKIP;
        }
    
        // Diff props
        diffProps(_node, oldVNode.props.attrs, vnode);
        oldVNode.props.attrs = vnode.props.attrs;
    
        // Check if innerHTML was changed, don't diff children
        if (vnode.props.dom && vnode.props.dom.innerHTML) {
          // Skip Children
          return PATCH.SKIP;
        }
    
        // Diff Children
        var newLength = vnode.children.length;
        var oldLength = oldVNode.children.length;
    
        if (newLength === 0) {
          // No Children, Remove all Children if not Already Removed
          if (oldLength !== 0) {
            var firstChild = null;
            while (firstChild = _node.firstChild) {
              removeChild(firstChild, _node);
            }
          }
        } else {
          // Traverse and Diff Children
          var totalLen = newLength > oldLength ? newLength : oldLength;
          for (var i = 0; i < totalLen; i++) {
            var oldChild = oldVNode.children[i];
            var child = vnode.children[i];
    
            var action = diff(oldChild, child, _node, instance);
    
            // Update Children to Match Action
            switch (action) {
              case PATCH.APPEND:
                oldVNode.children[oldLength++] = child;
                break;
              case PATCH.REMOVE:
                oldVNode.children.splice(i, 1);
                oldLength--;
                break;
              case PATCH.REPLACE:
                oldVNode.children[i] = vnode.children[i];
                break;
              case PATCH.TEXT:
                oldChild.val = child.val;
                break;
            }
          }
        }
    
        return PATCH.CHILDREN;
      } else {
        // Nothing Changed, Rehydrate and Exit
        vnode.meta.el = oldVNode.meta.el;
        return PATCH.SKIP;
      }
    };
    
    /* ======= Compiler ======= */
    var openRE = /\{\{/;
    var closeRE = /\}\}/;
    var modifierRE = /\[|\.|\(/;
    
    var compileTemplate = function (template, isString) {
      var state = {
        current: 0,
        template: template,
        output: ""
      };
    
      compileTemplateState(state, isString);
    
      return state.output;
    };
    
    var compileTemplateState = function (state, isString) {
      var template = state.template;
      var length = template.length;
      while (state.current < length) {
        // Match Text Between Templates
        var value = scanTemplateStateUntil(state, openRE);
    
        if (value) {
          state.output += value;
        }
    
        // If we've reached the end, there are no more templates
        if (state.current === length) {
          break;
        }
    
        // Exit The Opening Tag
        state.current += 2;
    
        // Get the name of the opening tag
        var name = scanTemplateStateUntil(state, closeRE);
    
        // If we've reached the end, the tag was unclosed
        if (state.current === length) {
          if ("development" !== "production") {
            error('Expected closing delimiter "}}" after "' + name + '"');
          }
          break;
        }
    
        if (name) {
          var modifiers = "";
          var modifierIndex = null;
          if ((modifierIndex = name.search(modifierRE)) !== -1) {
            modifiers = name.substring(modifierIndex);
            name = name.substring(0, modifierIndex);
          }
    
          if (isString) {
            state.output += '" + instance.get("' + name + '")' + modifiers + ' + "';
          } else {
            state.output += 'instance.get("' + name + '")' + modifiers;
          }
        }
    
        state.current += 2;
      }
    };
    
    var scanTemplateStateUntil = function (state, re) {
      var template = state.template;
      var tail = template.substring(state.current);
      var length = tail.length;
      var idx = tail.search(re);
    
      var match = "";
    
      switch (idx) {
        case -1:
          match = tail;
          break;
        case 0:
          match = '';
          break;
        default:
          match = tail.substring(0, idx);
      }
    
      state.current += match.length;
    
      return match;
    };
    
    var lex = function (input) {
      var state = {
        input: input,
        current: 0,
        tokens: []
      };
      lexState(state);
      return state.tokens;
    };
    
    var lexState = function (state) {
      var input = state.input;
      var len = input.length;
      while (state.current < len) {
        // Check if it is text
        if (input.charAt(state.current) !== "<") {
          lexText(state);
          continue;
        }
    
        // Check if it is a comment
        if (input.substr(state.current, 4) === "<!--") {
          lexComment(state);
          continue;
        }
    
        // It's a tag
        lexTag(state);
      }
    };
    
    var lexText = function (state) {
      var input = state.input;
      var len = input.length;
      var endOfText = input.indexOf("<", state.current);
      // Only Text
      if (endOfText === -1) {
        state.tokens.push({
          type: "text",
          value: input.slice(state.current)
        });
        state.current = len;
        return;
      }
    
      // No Text at All
      if (endOfText === state.current) {
        return;
      }
    
      // End of Text Found
      state.tokens.push({
        type: "text",
        value: input.slice(state.current, endOfText)
      });
      state.current = endOfText;
    };
    
    var lexComment = function (state) {
      var input = state.input;
      var len = input.length;
      state.current += 4;
      var endOfComment = input.indexOf("-->", state.current);
    
      // Only an unclosed comment
      if (endOfComment === -1) {
        state.tokens.push({
          type: "comment",
          value: input.slice(state.current)
        });
        state.current = len;
        return;
      }
    
      // End of Comment Found
      state.tokens.push({
        type: "comment",
        value: input.slice(state.current, endOfComment)
      });
      state.current = endOfComment + 3;
    };
    
    var lexTag = function (state) {
      var input = state.input;
      var len = input.length;
    
      // Lex Starting of Tag
      var isClosingStart = input.charAt(state.current + 1) === "/";
      state.tokens.push({
        type: "tagStart",
        close: isClosingStart
      });
      state.current += isClosingStart ? 2 : 1;
    
      // Lex type and attributes
      var tagType = lexTagType(state);
      lexAttributes(state);
    
      // Lex ending tag
      var isClosingEnd = input.charAt(state.current) === "/";
      state.tokens.push({
        type: "tagEnd",
        close: false
      });
      state.current += isClosingEnd ? 2 : 1;
      if (isClosingEnd) {
        state.tokens.push({
          type: "tagStart",
          close: true
        });
        state.tokens.push({
          type: "tag",
          value: tagType
        });
        state.tokens.push({
          type: "attribute",
          value: {}
        });
        state.tokens.push({
          type: "tagEnd",
          close: false
        });
      }
    };
    
    var lexTagType = function (state) {
      var input = state.input;
      var len = input.length;
      var start = state.current;
      while (start < len) {
        var char = input.charAt(start);
        if (char === "/" || char === ">" || char === " ") {
          start++;
        } else {
          break;
        }
      }
    
      var end = start;
      while (end < len) {
        var char = input.charAt(end);
        if (char === "/" || char === ">" || char === " ") {
          break;
        } else {
          end++;
        }
      }
    
      var tagType = input.slice(start, end);
      state.tokens.push({
        type: "tag",
        value: tagType
      });
      state.current = end;
      return tagType;
    };
    
    var lexAttributes = function (state) {
      var input = state.input;
      var len = input.length;
      var end = state.current;
    
      var attrs = {};
    
      var char = input.charAt(end);
      var nextChar = input.charAt(end + 1);
    
      var incrementChar = function () {
        end++;
        char = input.charAt(end);
        nextChar = input.charAt(end + 1);
      };
    
      while (end < len) {
        // Reached the end of the tag
        if (char === ">" || char === "/" && nextChar === ">") {
          break;
        }
    
        // Reached end of an attribute
        if (char === " ") {
          incrementChar();
          continue;
        }
    
        // Begin obtaining the attribute name
        var attrName = "";
        var noValue = false;
        while (char !== "=" && end < len) {
          // Ensure attribute has a value
          if (char !== " " && char !== ">" || char === "/" && nextChar !== ">") {
            attrName += char;
          } else {
            // Attribute had no value, skip it
            noValue = true;
            break;
          }
          incrementChar();
        }
    
        var attrValue = {
          name: attrName,
          value: "",
          meta: {}
        };
    
        if (noValue) {
          attrs[attrName] = attrValue;
          continue;
        }
    
        var quoteType = " ";
    
        // Exit equal sign and setup quote type
        incrementChar();
        if (char === "'" || char === "\"") {
          quoteType = char;
          incrementChar();
        } else {
          attrValue.value += char;
        }
    
        while ((char !== quoteType && char !== ">" || char === "/" && nextChar !== ">") && end < len) {
          attrValue.value += char;
          incrementChar();
        }
    
        if (attrName.indexOf(":") !== -1) {
          var attrNames = attrName.split(":");
          attrValue.name = attrNames[0];
          attrValue.meta.arg = attrNames[1];
        }
    
        attrs[attrName] = attrValue;
        incrementChar();
      }
    
      state.current = end;
      state.tokens.push({
        type: "attribute",
        value: attrs
      });
    };
    
    var parse = function (tokens) {
      var root = {
        type: "ROOT",
        children: []
      };
    
      var state = {
        current: 0,
        tokens: tokens
      };
    
      while (state.current < tokens.length) {
        var child = walk(state);
        if (child) {
          root.children.push(child);
        }
      }
    
      return root;
    };
    
    var HTML_ELEMENTS = ["area", "base", "br", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
    var SVG_ELEMENTS = ["svg", "animate", "circle", "clippath", "cursor", "defs", "desc", "ellipse", "filter", "font-face", "foreignObject", "g", "glyph", "image", "line", "marker", "mask", "missing-glyph", "path", "pattern", "polygon", "polyline", "rect", "switch", "symbol", "text", "textpath", "tspan", "use", "view"];
    
    var createParseNode = function (type, props, children) {
      return {
        type: type,
        props: props,
        children: children
      };
    };
    
    var walk = function (state) {
      var token = state.tokens[state.current];
      var previousToken = state.tokens[state.current - 1];
      var secondToken = state.tokens[state.current + 1];
      var thirdToken = state.tokens[state.current + 2];
      var fourthToken = state.tokens[state.current + 3];
    
      var increment = function (num) {
        state.current += num === undefined ? 1 : num;
        token = state.tokens[state.current];
        previousToken = state.tokens[state.current - 1];
        secondToken = state.tokens[state.current + 1];
        thirdToken = state.tokens[state.current + 2];
      };
    
      if (token.type === "text") {
        increment();
        return previousToken.value;
      }
    
      if (token.type === "comment") {
        increment();
        return;
      }
    
      // Start of new Tag
      if (token.type === "tagStart" && !token.close && !fourthToken.close) {
        var node = createParseNode(secondToken.value, thirdToken.value, []);
        var tagType = secondToken.value;
        // Exit Start Tag
        increment(4);
    
        // If it is an svg element, let code generator know
        if (SVG_ELEMENTS.indexOf(node.type) !== -1) {
          node.isSVG = true;
        }
    
        // If it's self closing, return it here
        if (HTML_ELEMENTS.indexOf(node.type) !== -1) {
          return node;
        }
    
        var startContentIndex = state.current;
        // Make sure it has content and is closed
        if (token) {
          // Find Closing Tag, and push children recursively
          while (token.type !== "tagStart" || token.type === "tagStart" && !token.close) {
            // Push a parsed child to the current node
            var parsedChildState = walk(state);
            if (parsedChildState) {
              node.children.push(parsedChildState);
            }
            increment(0);
            if (!token) {
              // No token means a tag was left unclosed
              if ("development" !== "production") {
                error('The element "' + node.type + '" was left unclosed.');
              }
              break;
            }
          }
          increment();
        }
    
        return node;
      }
    
      increment();
      return;
    };
    
    /**
     * Generates Code for Props
     * @param {Object} vnode
     * @return {String} generated code
     */
    var generateProps = function (vnode) {
      var attrs = vnode.props.attrs;
      var generatedObject = "{attrs: {";
    
      if (attrs) {
        // Invoke any special directives that need to change values before code generation
        for (var beforeAttr in attrs) {
          var beforeAttrName = attrs[beforeAttr].name;
          if (specialDirectives[beforeAttrName] && specialDirectives[beforeAttrName].beforeGenerate) {
            specialDirectives[beforeAttrName].beforeGenerate(attrs[beforeAttr].value, attrs[beforeAttr].meta, vnode);
          }
        }
    
        // Generate all other attributes
        for (var attr in attrs) {
          // Get attr by it's actual name (in case it had any arguments)
          var attrName = attrs[attr].name;
    
          // If it is a directive, mark it as dynamic
          if (directives[attrName]) {
            vnode.meta.shouldRender = true;
          }
    
          // Compile Special Directives
          if (specialDirectives[attrName]) {
            // Special directive found that generates code after initial generation, push it to its known special directives to run afterGenerate later
            if (specialDirectives[attrName].afterGenerate) {
              if (!vnode.specialDirectivesAfter) {
                vnode.specialDirectivesAfter = {};
              }
              vnode.specialDirectivesAfter[attr] = attrs[attr];
            }
    
            // Invoke any special directives that need to change values of props during code generation
            if (specialDirectives[attrName].duringPropGenerate) {
              generatedObject += specialDirectives[attrName].duringPropGenerate(attrs[attr].value, attrs[attr].meta, vnode);
            }
    
            // Keep a flag to know to always rerender this
            vnode.meta.shouldRender = true;
    
            // Remove special directive
            delete attrs[attr];
          } else {
            var normalizedProp = JSON.stringify(attrs[attr].value);
            var compiledProp = compileTemplate(normalizedProp, true);
            if (normalizedProp !== compiledProp) {
              vnode.meta.shouldRender = true;
            }
            generatedObject += '"' + attr + '": ' + compiledProp + ', ';
          }
        }
    
        if (Object.keys(attrs).length) {
          generatedObject = generatedObject.slice(0, -2) + "}";
        } else {
          generatedObject += "}";
        }
      }
    
      // Check for DOM Properties
      var dom = vnode.props.dom;
      if (dom) {
        vnode.dynamic = true;
        generatedObject += ", dom: {";
        for (var domProp in dom) {
          generatedObject += '"' + domProp + '": ' + dom[domProp] + ', ';
        }
        generatedObject = generatedObject.slice(0, -2) + "}";
      }
    
      // Close the generated object
      generatedObject += "}";
      return generatedObject;
    };
    
    /**
     * Generates Code for Event Listeners
     * @param {Object} listeners
     * @return {String} generated code
     */
    var generateEventListeners = function (listeners) {
      if (Object.keys(listeners).length === 0) {
        return "{}";
      }
      var generatedObject = "{";
    
      for (var type in listeners) {
        generatedObject += '"' + type + '": [' + generateArray(listeners[type]) + '], ';
      }
    
      generatedObject = generatedObject.slice(0, -2) + "}";
    
      return generatedObject;
    };
    
    /**
     * Generates Code for Metadata
     * @param {Object} meta
     * @return {String} generated code
     */
    var generateMeta = function (meta) {
      var generatedObject = "{";
    
      for (var key in meta) {
        if (key === 'eventListeners') {
          generatedObject += '"' + key + '": ' + generateEventListeners(meta[key]) + ', ';
        } else {
          generatedObject += '"' + key + '": ' + meta[key] + ', ';
        }
      }
    
      generatedObject = generatedObject.slice(0, -2) + "}";
    
      return generatedObject;
    };
    
    /**
     * Generates Code for an Array
     * @param {Array} arr
     * @return {String} generated array
     */
    var generateArray = function (arr) {
      var generatedArray = "";
    
      for (var i = 0; i < arr.length; i++) {
        generatedArray += arr[i] + ', ';
      }
    
      generatedArray = generatedArray.slice(0, -2);
    
      return generatedArray;
    };
    
    /**
     * Creates an "h" Call for a VNode
     * @param {Object} vnode
     * @param {Object} parentVNode
     * @return {String} "h" call
     */
    var createCall = function (vnode, parentVNode) {
      // Generate Code for Type
      var call = 'h("' + vnode.type + '", ';
    
      // Generate Code for Props
      call += generateProps(vnode) + ", ";
    
      // Generate code for children recursively here (in case modified by special directives)
      var children = vnode.children.map(function (item) {
        return generateEl(item, vnode);
      });
    
      // If the "shouldRender" flag is not present, ensure node won't be updated
      if (vnode.meta.shouldRender && parentVNode) {
        parentVNode.meta.shouldRender = true;
      }
    
      // Generate Code for Metadata
      call += generateMeta(vnode.meta);
    
      // Generate Code for Children
      call += children.length ? ", [" + generateArray(children) + "]" : ", []";
    
      // Close Call
      call += ")";
      return call;
    };
    
    var generateEl = function (el, parentEl) {
      var code = "";
    
      if (typeof el === "string") {
        // Escape newlines and double quotes, and compile the string
        var escapedString = escapeString(el);
        var compiledText = compileTemplate(escapedString, true);
        var textMeta = defaultMetadata();
    
        if (escapedString !== compiledText) {
          if (parentEl) {
            parentEl.meta.shouldRender = true;
          }
          textMeta.shouldRender = true;
        }
    
        code += 'h("#text", ' + generateMeta(textMeta) + ', "' + compiledText + '")';
      } else {
        // Recursively generate code for children
    
        // Generate Metadata if not Already
        if (!el.meta) {
          el.meta = defaultMetadata();
        }
    
        // Detect SVG Element
        if (el.isSVG) {
          el.meta.isSVG = true;
        }
    
        // Setup Nested Attributes within Properties
        el.props = {
          attrs: el.props
        };
    
        // Create a Call for the Element, or Register a Slot
        var slotNameAttr = el.props.attrs.name;
        var compiledCode = "";
        if (el.type === "slot") {
          if (parentEl) {
            parentEl.meta.shouldRender = true;
          }
          compiledCode = 'instance.$slots[\'' + (slotNameAttr && slotNameAttr.value || "default") + '\']';
        } else {
          compiledCode = createCall(el, parentEl);
        }
    
        // Check for Special Directives that change the code after generation and run them
        if (el.specialDirectivesAfter) {
          for (var specialDirectiveAfter in el.specialDirectivesAfter) {
            compiledCode = specialDirectives[el.specialDirectivesAfter[specialDirectiveAfter].name].afterGenerate(el.specialDirectivesAfter[specialDirectiveAfter].value, el.specialDirectivesAfter[specialDirectiveAfter].meta, compiledCode, el);
          }
        }
        code += compiledCode;
      }
      return code;
    };
    
    var generate = function (ast) {
      // Get root element
      var root = ast.children[0];
      // Begin Code
      var code = "var instance = this; return " + generateEl(root);
    
      try {
        return new Function("h", code);
      } catch (e) {
        error("Could not create render function");
        return noop;
      }
    };
    
    var compile = function (template) {
      var tokens = lex(template);
      var ast = parse(tokens);
      return generate(ast);
    };
    
    function Moon(opts) {
      /* ======= Initial Values ======= */
      this.$opts = opts || {};
    
      this.$id = id++;
    
      this.$name = this.$opts.name || "root";
      this.$data = this.$opts.data || {};
      this.$render = this.$opts.render || noop;
      this.$hooks = this.$opts.hooks || {};
      this.$methods = this.$opts.methods || {};
      this.$events = {};
      this.$dom = {};
      this.$observer = new Observer(this);
      this.$destroyed = false;
      this.$initialRender = true;
      this.$queued = false;
    
      // Setup Computed Properties
      if (this.$opts.computed) {
        initComputed(this, this.$opts.computed);
      }
    
      /* ======= Initialize 🎉 ======= */
      this.init();
    }
    
    /* ======= Instance Methods ======= */
    
    /**
     * Gets Value in Data
     * @param {String} key
     * @return {String} Value of key in data
     */
    Moon.prototype.get = function (key) {
      if (this.$observer.dep.target) {
        var target = this.$observer.dep.target;
        if (!this.$observer.dep.map[key]) {
          this.$observer.dep.map[key] = [target];
        } else if (this.$observer.dep.map[key].indexOf(target) === -1) {
          this.$observer.dep.map[key].push(target);
        }
      }
      return this.$data[key];
    };
    
    /**
     * Sets Value in Data
     * @param {String} key
     * @param {String} val
     */
    Moon.prototype.set = function (key, val) {
      var base = resolveKeyPath(this, this.$data, key, val);
      this.$observer.notify(base);
      queueBuild(this);
    };
    
    /**
     * Destroys Moon Instance
     */
    Moon.prototype.destroy = function () {
      this.removeEvents();
      this.$el = null;
      this.$destroyed = true;
      callHook(this, 'destroyed');
    };
    
    /**
     * Calls a method
     * @param {String} method
     */
    Moon.prototype.callMethod = function (method, args) {
      args = args || [];
      this.$methods[method].apply(this, args);
    };
    
    // Event Emitter, adapted from https://github.com/KingPixil/voke
    
    /**
     * Attaches an Event Listener
     * @param {String} eventName
     * @param {Function} action
     */
    Moon.prototype.on = function (eventName, action) {
      if (this.$events[eventName]) {
        this.$events[eventName].push(action);
      } else {
        this.$events[eventName] = [action];
      }
    };
    
    /**
     * Removes an Event Listener
     * @param {String} eventName
     * @param {Function} action
     */
    Moon.prototype.off = function (eventName, action) {
      var index = this.$events[eventName].indexOf(action);
      if (index !== -1) {
        this.$events[eventName].splice(index, 1);
      }
    };
    
    /**
     * Removes All Event Listeners
     * @param {String} eventName
     * @param {Function} action
     */
    Moon.prototype.removeEvents = function () {
      for (var evt in this.$events) {
        this.$events[evt] = [];
      }
    };
    
    /**
     * Emits an Event
     * @param {String} eventName
     * @param {Object} meta
     */
    Moon.prototype.emit = function (eventName, meta) {
      meta = meta || {};
      meta.type = eventName;
    
      if (this.$events["*"]) {
        for (var i = 0; i < this.$events["*"].length; i++) {
          this.$events["*"][i](meta);
        }
      }
    
      for (var _i = 0; _i < this.$events[eventName].length; _i++) {
        this.$events[eventName][_i](meta);
      }
    };
    
    /**
     * Renders "m-for" Directive Array
     * @param {Array} arr
     * @param {Function} item
     */
    Moon.prototype.renderLoop = function (arr, item) {
      var items = new Array(arr.length);
      for (var i = 0; i < arr.length; i++) {
        items[i] = item(arr[i], i);
      }
      return items;
    };
    
    /**
     * Renders a Class in Array/Object Form
     * @param {Array|Object|String} classNames
     * @return {String} renderedClassNames
     */
    Moon.prototype.renderClass = function (classNames) {
      if (typeof classNames === "string") {
        return classNames;
      }
      var renderedClassNames = "";
      if (Array.isArray(classNames)) {
        for (var i = 0; i < classNames.length; i++) {
          renderedClassNames += this.renderClass(classNames[i]) + ' ';
        }
      } else if (typeof classNames === "object") {
        for (var className in classNames) {
          if (classNames[className]) {
            renderedClassNames += className + ' ';
          }
        }
      }
      renderedClassNames = renderedClassNames.slice(0, -1);
      return renderedClassNames;
    };
    
    /**
     * Mounts Moon Element
     * @param {Object} el
     */
    Moon.prototype.mount = function (el) {
      this.$el = document.querySelector(el);
      this.$destroyed = false;
    
      if ("development" !== "production" && !this.$el) {
        error("Element " + this.$opts.el + " not found");
      }
    
      // Sync Element and Moon instance
      this.$el.__moon__ = this;
    
      // Setup template as provided `template` or outerHTML of the Element
      this.$template = this.$opts.template || this.$el.outerHTML;
    
      // Setup render Function
      if (this.$render === noop) {
        this.$render = Moon.compile(this.$template);
      }
    
      // Run First Build
      this.build();
      callHook(this, 'mounted');
    };
    
    /**
     * Renders Virtual DOM
     * @return Virtual DOM
     */
    Moon.prototype.render = function () {
      return this.$render(h);
    };
    
    /**
     * Diff then Patches Nodes With Data
     * @param {Object} old
     * @param {Object} vnode
     * @param {Object} parent
     */
    Moon.prototype.patch = function (old, vnode, parent) {
      if (old.meta && old.meta.el) {
    
        if (vnode.type !== old.type) {
          // Root Element Changed During Diff
          // Replace Root Element
          replaceChild(old.meta.el, createNodeFromVNode(vnode, this), parent);
    
          // Update Bound Instance
          this.$el = vnode.meta.el;
          this.$el.__moon__ = this;
        } else {
          // Diff
          diff(old, vnode, parent, this);
        }
      } else if (old instanceof Node) {
        // Hydrate
        var newNode = hydrate(old, vnode, parent, this);
    
        if (newNode !== old) {
          // Root Element Changed During Hydration
          this.$el = vnode.meta.el;
          this.$el.__moon__ = this;
        }
      }
    
      this.$initialRender = false;
    };
    
    /**
     * Render and Patches the DOM With Data
     */
    Moon.prototype.build = function () {
      var dom = this.render();
      var old = null;
    
      if (this.$dom.meta) {
        old = this.$dom;
      } else {
        old = this.$el;
        this.$dom = dom;
      }
    
      this.patch(old, dom, this.$el.parentNode);
    };
    
    /**
     * Initializes Moon
     */
    Moon.prototype.init = function () {
      log("======= Moon =======");
      callHook(this, 'init');
    
      if (this.$opts.el) {
        this.mount(this.$opts.el);
      }
    };
    
    /* ======= Global API ======= */
    
    /**
     * Configuration of Moon
     */
    Moon.config = {
      silent: "development" === "production" || typeof console === 'undefined',
      prefix: "m-",
      keyCodes: function (keyCodes) {
        for (var keyCode in keyCodes) {
          eventModifiersCode[keyCode] = 'if(event.keyCode !== ' + keyCodes[keyCode] + ') {return;};';
        }
      }
    };
    
    /**
     * Version of Moon
     */
    Moon.version = '0.8.0';
    
    /**
     * Moon Utilities
     */
    Moon.util = {
      noop: noop,
      error: error,
      log: log,
      merge: merge,
      extend: extend,
      h: h
    };
    
    /**
     * Runs an external Plugin
     * @param {Object} plugin
     */
    Moon.use = function (plugin) {
      plugin.init(Moon);
    };
    
    /**
     * Compiles HTML to a Render Function
     * @param {String} template
     * @return {Function} render function
     */
    Moon.compile = function (template) {
      return compile(template);
    };
    
    /**
     * Runs a Task After Update Queue
     * @param {Function} task
     */
    Moon.nextTick = function (task) {
      setTimeout(task, 0);
    };
    
    /**
     * Creates a Directive
     * @param {String} name
     * @param {Function} action
     */
    Moon.directive = function (name, action) {
      directives[Moon.config.prefix + name] = action;
    };
    
    /**
     * Creates a Component
     * @param {String} name
     * @param {Function} action
     */
    Moon.component = function (name, opts) {
      var Parent = this;
    
      if (opts.name) {
        name = opts.name;
      } else {
        opts.name = name;
      }
    
      function MoonComponent() {
        Moon.call(this, opts);
      }
    
      MoonComponent.prototype = Object.create(Parent.prototype);
      MoonComponent.prototype.constructor = MoonComponent;
    
      MoonComponent.prototype.init = function () {
        callHook(this, 'init');
        this.$destroyed = false;
        this.$props = this.$opts.props || [];
    
        this.$template = this.$opts.template;
    
        if (this.$render === noop) {
          this.$render = Moon.compile(this.$template);
        }
      };
    
      components[name] = {
        CTor: MoonComponent,
        opts: opts
      };
    
      return MoonComponent;
    };
    
    /* ======= Default Directives ======= */
    
    specialDirectives[Moon.config.prefix + "if"] = {
      afterGenerate: function (value, meta, code, vnode) {
        return '(' + compileTemplate(value, false) + ') ? ' + code + ' : null';
      }
    };
    
    specialDirectives[Moon.config.prefix + "show"] = {
      duringPropGenerate: function (value, meta, vnode) {
        return '"m-show": ' + compileTemplate(value, false) + ', ';
      }
    };
    
    specialDirectives[Moon.config.prefix + "for"] = {
      afterGenerate: function (value, meta, code, vnode) {
        var parts = value.split(" in ");
        var aliases = parts[0].split(",");
    
        var iteratable = compileTemplate(parts[1], false);
    
        var params = aliases.join(",");
        code.replace(new RegExp('instance.get("(' + aliases.join("|") + ')")', 'g'), function (match, alias) {
          code = code.replace(new RegExp('instance.get\\("' + alias + '"\\)', "g"), alias);
        });
    
        return 'instance.renderLoop(' + iteratable + ', function(' + params + ') { return ' + code + '; })';
      }
    };
    
    specialDirectives[Moon.config.prefix + "on"] = {
      beforeGenerate: function (value, meta, vnode) {
    
        // Extract modifiers and the event
        var rawModifiers = meta.arg.split(".");
        var eventToCall = rawModifiers[0];
        var params = "event";
        var methodToCall = compileTemplate(value, false);
        var rawParams = methodToCall.split("(");
    
        if (rawParams.length > 1) {
          methodToCall = rawParams.shift();
          params = rawParams.join("(").slice(0, -1);
        }
        var modifiers = "";
    
        rawModifiers.shift();
    
        for (var i = 0; i < rawModifiers.length; i++) {
          modifiers += eventModifiersCode[rawModifiers[i]];
        }
    
        var code = 'function(event) {' + modifiers + 'instance.callMethod("' + methodToCall + '", [' + params + '])}';
        if (!vnode.meta.eventListeners[eventToCall]) {
          vnode.meta.eventListeners[eventToCall] = [code];
        } else {
          vnode.meta.eventListeners[eventToCall].push(code);
        }
      }
    };
    
    specialDirectives[Moon.config.prefix + "model"] = {
      beforeGenerate: function (value, meta, vnode) {
        // Compile a string value for the keypath
        var compiledStringValue = compileTemplate(value, true);
        // Setup default event types and dom property to change
        var eventType = "input";
        var valueProp = "value";
    
        // If input type is checkbox, listen on 'change' and change the 'checked' dom property
        if (vnode.props.attrs.type && vnode.props.attrs.type.value === "checkbox") {
          eventType = "change";
          valueProp = "checked";
        }
    
        // Generate event listener code
        var code = 'function(event) {instance.set("' + compiledStringValue + '", event.target.' + valueProp + ')}';
    
        // Push the listener to it's event listeners
        if (!vnode.meta.eventListeners[eventType]) {
          vnode.meta.eventListeners[eventType] = [code];
        } else {
          vnode.meta.eventListeners[eventType].push(code);
        }
    
        // Setup a query used to get the value, and set the corresponding dom property
        var getQuery = compileTemplate('{{' + compileTemplate(value, false) + '}}', false);
        if (!vnode.props.dom) {
          vnode.props.dom = {};
        }
        vnode.props.dom[valueProp] = getQuery;
      }
    };
    
    specialDirectives[Moon.config.prefix + "literal"] = {
      duringPropGenerate: function (value, meta, vnode) {
        var prop = meta.arg;
        // make sure object is treated correctly during code generation
        vnode.props.attrs[prop] = {
          value: true,
          meta: {}
        };
    
        if (prop === "class") {
          // Classes need to be rendered differently
          return '"class": instance.renderClass(' + compileTemplate(value, false) + '), ';
        }
        return '"' + prop + '": ' + compileTemplate(value, false) + ', ';
      }
    };
    
    specialDirectives[Moon.config.prefix + "html"] = {
      beforeGenerate: function (value, meta, vnode) {
        if (!vnode.props.dom) {
          vnode.props.dom = {};
        }
        vnode.props.dom.innerHTML = '"' + compileTemplate(value, true) + '"';
      }
    };
    
    specialDirectives[Moon.config.prefix + "text"] = {
      beforeGenerate: function (value, meta, vnode) {
        vnode.children = [value];
      }
    };
    
    directives[Moon.config.prefix + "show"] = function (el, val, vnode) {
      el.style.display = val ? '' : 'none';
    };
    
    directives[Moon.config.prefix + "mask"] = function (el, val, vnode) {};
    return Moon;
}));
