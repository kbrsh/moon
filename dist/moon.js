/**
 * Moon v0.11.0
 * Copyright 2016-2017 Kabir Shah
 * Released under the MIT License
 * http://moonjs.ga
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
      ctrl: 'if(event.ctrlKey === false) {return null;};',
      shift: 'if(event.shiftKey === false) {return null;};',
      alt: 'if(event.altKey === false) {return null;};',
      enter: 'if(event.keyCode !== 13) {return null;};'
    };
    var eventModifiers = {};
    
    /* ======= Observer ======= */
    /**
     * Sets Up Methods
     * @param {Object} instance
     * @param {Array} methods
     */
    var initMethods = function(instance, methods) {
      var data = instance.data;
    
      var initMethod = function(methodName, method) {
        if("development" !== "production" && data.hasOwnProperty(methodName) === true) {
          error(("Method \"" + methodName + "\" has the same key as a data property and will overwrite it"));
        }
        data[methodName] = function() {
          return method.apply(instance, arguments);
        }
      }
    
      for(var method in methods) {
        initMethod(method, methods[method]);
      }
    }
    
    /**
     * Makes Computed Properties for an Instance
     * @param {Object} instance
     * @param {Object} computed
     */
    var initComputed = function(instance, computed) {
      var setComputedProperty = function(prop) {
        var observer = instance.observer;
        var option = computed[prop];
        var getter = option.get;
        var setter = option.set;
    
        // Add Getters
        Object.defineProperty(instance.data, prop, {
          get: function() {
            // Property Cache
            var cache;
    
            // If no cache, create it
            if(observer.cache[prop] === undefined) {
              // Capture Dependencies
              observer.target = prop;
    
              // Invoke getter
              cache = getter.call(instance);
    
              // Stop Capturing Dependencies
              observer.target = undefined;
    
              // Store value in cache
              observer.cache[prop] = cache;
            } else {
              // Cache found, use it
              cache = observer.cache[prop];
            }
    
            return cache;
          },
          set: setter === undefined ? noop : function(val) {
            setter.call(instance, val);
          }
        });
      }
    
      // Set All Computed Properties
      for(var propName in computed) {
        setComputedProperty(propName);
      }
    }
    
    function Observer(instance) {
      // Associated Moon Instance
      this.instance = instance;
    
      // Computed Property Cache
      this.cache = {};
    
      // Property Currently Being Observed for Dependencies
      this.target = undefined;
    
      // Dependency Map
      this.map = {};
    }
    
    Observer.prototype.notify = function(key) {
      var this$1 = this;
    
      var map = this.map[key];
      if(map !== undefined) {
        for(var i = 0; i < map.length; i++) {
          this$1.notify(map[i]);
        }
      }
    
      var cache = this.cache;
      if(cache[key] !== undefined) {
        cache[key] = undefined;
      }
    }
    
    
    /* ======= Global Utilities ======= */
    
    var escapeRE = /(?:(?:&(?:lt|gt|quot|amp);)|"|\\|\n)/g;
    var escapeMap = {
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": "\\\"",
      "&amp;": "&",
      "\\": "\\\\",
      "\"": "\\\"",
      "\n": "\\n"
    }
    
    /**
     * Logs a Message
     * @param {String} msg
     */
    var log = function(msg) {
      if(Moon.config.silent === false) {
        console.log(msg);
      }
    }
    
    /**
     * Throws an Error
     * @param {String} msg
     */
    var error = function(msg) {
      if(Moon.config.silent === false) {
        console.error("[Moon] ERROR: " + msg);
      }
    }
    
    /**
     * Adds DOM Updates to Queue
     * @param {Object} instance
     */
    var queueBuild = function(instance) {
      if(instance.queued === false) {
        instance.queued = true;
        setTimeout(function() {
          instance.build();
          instance.queued = false;
          callHook(instance, "updated");
        }, 0);
      }
    }
    
    /**
     * Calls a Hook
     * @param {Object} instance
     * @param {String} name
     */
    var callHook = function(instance, name) {
      var hook = instance.hooks[name];
      if(hook !== undefined) {
        hook.call(instance);
      }
    }
    
    /**
     * Extends an Object with another Object's properties
     * @param {Object} parent
     * @param {Object} child
     * @return {Object} Extended Parent
     */
    var extend = function(parent, child) {
      for(var key in child) {
        parent[key] = child[key];
      }
    
      return parent;
    }
    
    /**
     * Defines a Property on an Object or a Default Value
     * @param {Object} obj
     * @param {String} prop
     * @param {Any} value
     * @param {Any} def
     */
    var defineProperty = function(obj, prop, value, def) {
      if(value === undefined) {
        obj[prop] = def;
      } else {
        obj[prop] = value;
      }
    }
    
    /**
     * Escapes a String
     * @param {String} str
     */
    var escapeString = function(str) {
      return str.replace(escapeRE, function(match) {
        return escapeMap[match];
      });
    }
    
    /**
     * Does No Operation
     */
    var noop = function() {
    
    }
    
    /**
     * Adds An Event Handler to a Type of Listener
     * @param {Object} node
     * @param {String} type
     * @param {Object} eventListeners
     */
    var addEventHandler = function(node, type, eventListeners) {
      // Create handle function
      var handle = function(evt) {
        var handlers = handle.handlers;
        for(var i = 0; i < handlers.length; i++) {
          handlers[i](evt);
        }
      }
    
      // Add handlers to handle
      handle.handlers = eventListeners[type];
    
      // Add handler to vnode
      eventListeners[type] = handle;
    
      // Add event listener
      node.addEventListener(type, handle);
    }
    
    var addEventListeners = function(node, eventListeners) {
      for(var type in eventListeners) {
        addEventHandler(node, type, eventListeners);
      }
    }
    
    /**
     * Creates DOM Node from VNode
     * @param {Object} vnode
     * @return {Object} DOM Node
     */
    var createNodeFromVNode = function(vnode) {
      var type = vnode.type;
      var meta = vnode.meta;
      var node;
    
      if(type === "#text") {
        // Create textnode
        node = document.createTextNode(vnode.value);
      } else {
        var children = vnode.children;
        node = meta.isSVG === 1 ? document.createElementNS("http://www.w3.org/2000/svg", type) : document.createElement(type);
    
        // Optimization: VNode only has one child that is text, and create it here
        var firstChild = children[0];
        if(children.length === 1 && firstChild.type === "#text") {
          node.textContent = firstChild.value;
          firstChild.meta.node = node.firstChild;
        } else {
          // Add all children
          for(var i = 0; i < children.length; i++) {
            var vchild = children[i];
            appendChild(createNodeFromVNode(vchild), vchild, node);
          }
        }
    
        // Add all event listeners
        var eventListeners = meta.eventListeners;
        if(eventListeners !== undefined) {
          addEventListeners(node, eventListeners);
        }
    
        // Setup Props
        diffProps(node, {}, vnode, vnode.props);
      }
    
      // Hydrate
      vnode.meta.node = node;
    
      return node;
    }
    
    /**
     * Appends a Child, Ensuring Components are Mounted
     * @param {Object} node
     * @param {Object} vnode
     * @param {Object} parent
     */
    var appendChild = function(node, vnode, parent) {
      // Append the node
      parent.appendChild(node);
    
      // Check for Component
      var component = vnode.meta.component;
      if(component !== undefined) {
        createComponentFromVNode(node, vnode, component);
      }
    }
    
    /**
     * Removes a Child, Ensuring Components are Unmounted
     * @param {Object} node
     * @param {Object} parent
     */
    var removeChild = function(node, parent) {
      // Check for Component
      var componentInstance = node.__moon__;
      if(componentInstance !== undefined) {
        // Component was unmounted, destroy it here
        componentInstance.destroy();
      }
    
      // Remove the Node
      parent.removeChild(node);
    }
    
    /**
     * Replaces a Child, Ensuring Components are Unmounted/Mounted
     * @param {Object} oldNode
     * @param {Object} newNode
     * @param {Object} vnode
     * @param {Object} parent
     */
    var replaceChild = function(oldNode, newNode, vnode, parent) {
      // Check for Component
      var componentInstance = oldNode.__moon__;
      if(componentInstance !== undefined) {
        // Component was unmounted, destroy it here
        componentInstance.destroy();
      }
    
      // Replace the node
      parent.replaceChild(newNode, oldNode);
    
      // Check for Component
      var component = vnode.meta.component;
      if(component !== undefined) {
        createComponentFromVNode(newNode, vnode, component);
      }
    }
    
    /**
     * Text VNode/Node Type
     */
    var TEXT_TYPE = "#text";
    
    /**
     * Creates a Virtual DOM Node
     * @param {String} type
     * @param {Object} props
     * @param {Object} meta
     * @param {Array} children
     * @return {Object} Virtual DOM Node
     */
    var createElement = function(type, props, meta, children) {
      return {
        type: type,
        props: props,
        meta: meta,
        children: children
      };
    }
    
    /**
     * Creates a Virtual DOM Text Node
     * @param {String} value
     * @param {Object} meta
     * @return {Object} Virtual DOM Text Node
     */
    var createTextElement = function(value, meta) {
      return {
        type: TEXT_TYPE,
        value: value,
        meta: meta
      };
    }
    
    /**
     * Compiles Arguments to a VNode
     * @param {String} type
     * @param {Object} attrs
     * @param {Object} meta
     * @param {Object|String} children
     * @return {Object} Object usable in Virtual DOM (VNode)
     */
    var m = function(type, props, meta, children) {
      var component;
    
      if(type === TEXT_TYPE) {
        // Text Node
        // Type => #text
        // Meta => props
        // Value => meta
        return createTextElement(meta, props);
      } else if((component = components[type]) !== undefined) {
        // Resolve Component
        if(component.options.functional === true) {
          return createFunctionalComponent(props, children, component);
        } else {
          meta.component = component;
        }
      }
    
      return createElement(type, props, meta, children);
    
      // In the end, we have a VNode structure like:
      // {
      //  type: 'h1', <= nodename
      //  props: {
      //    attrs: {'id': 'someId'}, <= regular attributes
      //    dom: {'textContent': 'some text content'} <= only for DOM properties added by directives,
      //    directives: {'m-mask': ''} <= any directives
      //  },
      //  meta: {}, <= metadata used internally
      //  children: [], <= any child nodes
      // }
    };
    
    /**
     * Renders a Class in Array/Object Form
     * @param {Array|Object|String} classNames
     * @return {String} renderedClassNames
     */
    m.renderClass = function(classNames) {
      if(typeof classNames === "string") {
        // If they are a string, no need for any more processing
        return classNames;
      }
    
      var renderedClassNames = '';
      if(Array.isArray(classNames)) {
        // It's an array, so go through them all and generate a string
        for(var i = 0; i < classNames.length; i++) {
          renderedClassNames += (m.renderClass(classNames[i])) + " ";
        }
      } else if(typeof classNames === "object") {
        // It's an object, so to through and render them to a string if the corresponding condition is truthy
        for(var className in classNames) {
          if(classNames[className]) {
            renderedClassNames += className + " ";
          }
        }
      }
    
      // Remove trailing space and return
      renderedClassNames = renderedClassNames.slice(0, -1);
      return renderedClassNames;
    }
    
    /**
     * Renders "m-for" Directive Array
     * @param {Array|Object|Number} iteratable
     * @param {Function} item
     */
    m.renderLoop = function(iteratable, item) {
      var items;
    
      if(Array.isArray(iteratable)) {
        items = new Array(iteratable.length);
    
        // Iterate through the array
        for(var i = 0; i < iteratable.length; i++) {
          items[i] = item(iteratable[i], i);
        }
      } else if(typeof iteratable === "object") {
        items = [];
    
        // Iterate through the object
        for(var key in iteratable) {
          items.push(item(iteratable[key], key));
        }
      } else if(typeof iteratable === "number") {
        items = new Array(iteratable);
    
        // Repeat a certain amount of times
        for(var i$1 = 0; i$1 < iteratable; i$1++) {
          items[i$1] = item(i$1 + 1, i$1);
        }
      }
    
      return items;
    }
    
    /**
     * Renders an Event Modifier
     * @param {Number} keyCode
     * @param {String} modifier
     */
     m.renderEventModifier = function(keyCode, modifier) {
      return keyCode === eventModifiers[modifier];
     }
    
    /**
     * Creates a Functional Component
     * @param {Object} props
     * @param {Array} children
     * @param {Object} functionalComponent
     * @return {Object} Virtual DOM Node
     */
    var createFunctionalComponent = function(props, children, functionalComponent) {
      var options = functionalComponent.options;
      var attrs = props.attrs;
      var data = {};
      var getData = options.data;
    
      if(getData !== undefined) {
        data = getData();
      }
    
      // Merge data with provided props
      var propNames = options.props;
      if(propNames === undefined) {
        data = attrs;
      } else {
        for(var i = 0; i < propNames.length; i++) {
          var prop = propNames[i];
          data[prop] = attrs[prop];
        }
      }
    
      // Call render function
      return options.render(m, {
        data: data,
        insert: children
      });
    }
    
    /**
     * Mounts a Component To The DOM
     * @param {Object} node
     * @param {Object} vnode
     * @param {Object} component
     */
    var createComponentFromVNode = function(node, vnode, component) {
      var props = component.options.props;
      var attrs = vnode.props.attrs;
      var data = {};
    
      // Merge data with provided props
      if(props !== undefined) {
        for(var i = 0; i < props.length; i++) {
          var prop = props[i];
          data[prop] = attrs[prop];
        }
      }
    
      var componentInstance = new component.CTor({
        props: data,
        insert: vnode.children
      });
    
      // Check for events
      var eventListeners = vnode.meta.eventListeners;
      if(eventListeners !== undefined) {
        extend(componentInstance.events, eventListeners);
      }
    
      // Mount
      componentInstance.mount(node);
    
      // Rehydrate
      vnode.meta.node = componentInstance.root;
    }
    
    /**
     * Diffs Event Listeners of Two VNodes
     * @param {Object} node
     * @param {Object} eventListeners
     * @param {Object} oldEventListeners
     */
    var diffEventListeners = function(node, eventListeners, oldEventListeners) {
      for(var type in eventListeners) {
        var oldEventListener = oldEventListeners[type];
        if(oldEventListener === undefined) {
          addEventHandler(node, type, eventListeners);
        } else {
          oldEventListeners[type].handlers = eventListeners[type];
        }
      }
    }
    
    /**
     * Diffs Props of Node and a VNode, and apply Changes
     * @param {Object} node
     * @param {Object} nodeProps
     * @param {Object} vnode
     * @param {Object} props
     */
    var diffProps = function(node, nodeProps, vnode, props) {
      // Get VNode Attributes
      var vnodeProps = props.attrs;
    
      // Diff VNode Props with Node Props
      for(var vnodePropName in vnodeProps) {
        var vnodePropValue = vnodeProps[vnodePropName];
        var nodePropValue = nodeProps[vnodePropName];
    
        if((vnodePropValue !== undefined && vnodePropValue !== false && vnodePropValue !== null) && ((nodePropValue === undefined || nodePropValue === false || nodePropValue === null) || vnodePropValue !== nodePropValue)) {
          if(vnodePropName.length === 10 && vnodePropName === "xlink:href") {
            node.setAttributeNS('http://www.w3.org/1999/xlink', "href", vnodePropValue);
          } else {
            node.setAttribute(vnodePropName, vnodePropValue === true ? '' : vnodePropValue);
          }
        }
      }
    
      // Diff Node Props with VNode Props
      for(var nodePropName in nodeProps) {
        var vnodePropValue$1 = vnodeProps[nodePropName];
        if(vnodePropValue$1 === undefined || vnodePropValue$1 === false || vnodePropValue$1 === null) {
          node.removeAttribute(nodePropName);
        }
      }
    
      // Execute any directives
      var vnodeDirectives = props.directives;
      if(vnodeDirectives !== undefined) {
        for(var directive in vnodeDirectives) {
          var directiveFn = directives[directive];
          if(directiveFn !== undefined) {
            directiveFn(node, vnodeDirectives[directive], vnode);
          } else if("development" !== "production") {
            error(("Could not find directive \"" + directive + "\""));
          }
        }
      }
    
      // Add/Update any DOM Props
      var dom = props.dom;
      if(dom !== undefined) {
        for(var domProp in dom) {
          var domPropValue = dom[domProp];
          if(node[domProp] !== domPropValue) {
            node[domProp] = domPropValue;
          }
        }
      }
    }
    
    /**
     * Diffs a Component
     * @param {Object} node
     * @param {Object} vnode
     */
    var diffComponent = function(node, vnode) {
      if(node.__moon__ === undefined) {
        // Not mounted, create a new instance and mount it here
        createComponentFromVNode(node, vnode, vnode.meta.component);
      } else {
        // Mounted already, need to update
        var componentInstance = node.__moon__;
        var componentChanged = false;
    
        // Merge any properties that changed
        var props = componentInstance.options.props;
        var data = componentInstance.data;
        var attrs = vnode.props.attrs;
    
        if(props !== undefined) {
          for(var i = 0; i < props.length; i++) {
            var prop = props[i];
            if(data[prop] !== attrs[prop]) {
              data[prop] = attrs[prop];
              componentChanged = true;
            }
          }
        }
    
    
        // If it has children, resolve insert
        if(vnode.children.length !== 0) {
          componentInstance.insert = vnode.children;
          componentChanged = true;
        }
    
        // If any changes were detected, build the component
        if(componentChanged === true) {
          componentInstance.build();
          callHook(componentInstance, "updated");
        }
      }
    }
    
    /**
     * Hydrates Node and a VNode
     * @param {Object} node
     * @param {Object} vnode
     * @param {Object} parent
     */
    var hydrate = function(node, vnode, parent) {
      var nodeName = node.nodeName.toLowerCase();
      var meta = vnode.meta;
      var component;
    
      if(nodeName !== vnode.type) {
        replaceChild(node, createNodeFromVNode(vnode), vnode, parent);
      } else if(vnode.type === TEXT_TYPE) {
        // Both are text nodes, update if needed
        if(node.textContent !== vnode.value) {
          node.textContent = vnode.value;
        }
    
        // Hydrate
        meta.node = node;
      } else if((component = meta.component) !== undefined) {
        // Component
        createComponentFromVNode(node, vnode, component);
      } else {
        // Hydrate
        meta.node = node;
    
        // Diff props
        var props = vnode.props;
        var rawNodeAttrs = node.attributes;
        var nodeAttrs = {};
        for(var i = 0; i < rawNodeAttrs.length; i++) {
          nodeAttrs[rawNodeAttrs[i].name] = rawNodeAttrs[i].value;
        }
        diffProps(node, nodeAttrs, vnode, props);
    
        // Add event listeners
        var eventListeners = meta.eventListeners;
        if(eventListeners !== undefined) {
          addEventListeners(node, eventListeners);
        }
    
        // Ensure innerHTML and textContent weren't changed
        var domProps = props.dom;
        if(domProps === undefined || (domProps.innerHTML === undefined && domProps.textContent === undefined)) {
          var children = vnode.children;
          var length = children.length;
    
          var i$1 = 0;
          var currentChildNode = node.firstChild;
          var vchild = length !== 0 ? children[0] : undefined;
          var nextSibling = null;
    
          while(vchild !== undefined || currentChildNode !== null) {
            nextSibling = null;
    
            if(currentChildNode === null) {
              appendChild(createNodeFromVNode(vchild), vchild, node);
            } else {
              nextSibling = currentChildNode.nextSibling;
              if(vchild === undefined) {
                removeChild(currentChildNode, node);
              } else {
                hydrate(currentChildNode, vchild, node);
              }
            }
    
            vchild = ++i$1 < length ? children[i$1] : undefined;
            currentChildNode = nextSibling;
          }
        }
      }
    }
    
    /**
     * Diffs VNodes, and applies Changes
     * @param {Object} oldVNode
     * @param {Object} vnode
     * @param {Number} index
     * @param {Object} parent
     * @param {Object} parentVNode
     */
    var diff = function(oldVNode, vnode, index, parent, parentVNode) {
      var oldMeta = oldVNode.meta;
      var meta = vnode.meta;
    
      if(oldVNode.type !== vnode.type) {
        // Different types, replace
        parentVNode.children[index] = vnode;
        replaceChild(oldMeta.node, createNodeFromVNode(vnode), vnode, parent);
      } else if(meta.shouldRender !== undefined) {
        if(vnode.type === TEXT_TYPE) {
          // Text, update if needed
          var value = vnode.value;
          if(oldVNode.value !== value) {
            oldVNode.value = value;
            oldMeta.node.textContent = value;
          }
        } else if(meta.component !== undefined) {
          // Component, diff props and insert
          diffComponent(oldMeta.node, vnode);
        } else {
          var node = oldMeta.node;
    
          // Diff props
          var oldProps = oldVNode.props;
          var props = vnode.props;
          diffProps(node, oldProps.attrs, vnode, props);
          oldProps.attrs = props.attrs;
    
          // Diff event listeners
          var eventListeners = meta.eventListeners;
          if(eventListeners !== undefined) {
            diffEventListeners(node, eventListeners, oldMeta.eventListeners);
          }
    
          // Ensure innerHTML wasn't changed
          var domProps = props.dom;
          if(domProps === undefined || (domProps.innerHTML === undefined && domProps.textContent === undefined)) {
            // Diff children
            var children = vnode.children;
            var oldChildren = oldVNode.children;
            var newLength = children.length;
            var oldLength = oldChildren.length;
    
            if(newLength === 0 && oldLength !== 0) {
              var firstChild = null;
              while((firstChild = node.firstChild) !== null) {
                removeChild(firstChild, node);
              }
              oldVNode.children = [];
            } else if(oldLength === 0) {
              for(var i = 0; i < newLength; i++) {
                var child = children[i];
                appendChild(createNodeFromVNode(child), child, node);
              }
              oldVNode.children = children;
            } else {
              var totalLen = newLength > oldLength ? newLength : oldLength;
              var oldChild;
              var child$1;
              for(var i$1 = 0; i$1 < totalLen; i$1++) {
                if(i$1 >= newLength) {
                  // Remove extra child
                  removeChild(oldChildren.pop().meta.el, node);
                } else if(i$1 >= oldLength) {
                  // Add extra child
                  child$1 = children[i$1];
                  appendChild(createNodeFromVNode(child$1), child$1, node);
                  oldChildren.push(child$1);
                } else {
                  // Diff child if they don't have the same reference
                  oldChild = oldChildren[i$1];
                  child$1 = children[i$1];
    
                  if(oldChild !== child$1) {
                    diff(oldChild, child$1, i$1, node, oldVNode);
                  }
                }
              }
            }
          }
        }
      }
    }
    
    
    /* ======= Compiler ======= */
    var openRE = /\{\{/;
    var closeRE = /\s*\}\}/;
    var whitespaceRE = /\s/;
    var expressionRE = /"[^"]*"|'[^']*'|\.\w*[a-zA-Z$_]\w*|\w*[a-zA-Z$_]\w*:|(\w*[a-zA-Z$_]\w*)/g;
    var globals = ["true", "false", "undefined", "null", "NaN", "typeof", "in", "event"];
    
    /**
     * Compiles a Template
     * @param {String} template
     * @param {Array} exclude
     * @param {Array} dependencies
     * @return {String} compiled template
     */
    var compileTemplate = function(template, exclude, dependencies) {
      var state = {
        current: 0,
        template: template,
        exclude: exclude,
        dependencies: dependencies
      };
    
      return compileTemplateState(state);
    }
    
    var compileTemplateState = function(state) {
      var template = state.template;
      var length = template.length;
      var output = "";
      while(state.current < length) {
        // Match Text Between Templates
        var value = scanTemplateStateUntil(state, openRE);
    
        if(value.length !== 0) {
          output += value;
        }
    
        // If we've reached the end, there are no more templates
        if(state.current === length) {
          break;
        }
    
        // Exit Opening Delimiter
        state.current += 2;
    
        // Consume whitespace
        scanTemplateStateForWhitespace(state);
    
        // Get the value of the expression
        var name = scanTemplateStateUntil(state, closeRE);
    
        // If we've reached the end, the tag was unclosed
        if(state.current === length) {
          if("development" !== "production") {
            error(("Expected closing delimiter \"}}\" after \"" + name + "\""));
          }
          break;
        }
    
        if(name.length !== 0) {
          // Extract Variable References
          compileTemplateExpression(name, state.exclude, state.dependencies);
    
          // Add quotes
          name = "\" + " + name + " + \"";
    
          // Generate code
          output += name;
        }
    
        // Consume whitespace
        scanTemplateStateForWhitespace(state);
    
        // Exit closing delimiter
        state.current += 2;
      }
    
      return output;
    }
    
    var compileTemplateExpression = function(expr, exclude, dependencies) {
      var references;
      while((references = expressionRE.exec(expr)) !== null) {
        var reference = references[1];
        if(reference !== undefined && dependencies.indexOf(reference) === -1 && exclude.indexOf(reference) === -1) {
          dependencies.push(reference);
        }
      }
    
      return dependencies;
    }
    
    var scanTemplateStateUntil = function(state, re) {
      var template = state.template;
      var tail = template.substring(state.current);
      var index = tail.search(re);
    
      var match = "";
    
      switch(index) {
        case -1:
          match = tail;
          break;
        case 0:
          match = '';
          break;
        default:
          match = tail.substring(0, index);
      }
    
      state.current += match.length;
    
      return match;
    }
    
    var scanTemplateStateForWhitespace = function(state) {
      var template = state.template;
      var char = template[state.current];
      while(whitespaceRE.test(char) === true) {
        char = template[++state.current];
      }
    }
    
    var tagOrCommentStartRE = /<\/?(?:[A-Za-z]+\w*)|<!--/;
    
    var lex = function(input) {
      var state = {
        input: input,
        current: 0,
        tokens: []
      }
      lexState(state);
      return state.tokens;
    }
    
    var lexState = function(state) {
      var input = state.input;
      var length = input.length;
    
      while(state.current < length) {
        // Check if it is text
        if(input.charAt(state.current) !== "<") {
          lexText(state);
          continue;
        }
    
        // Check if it is a comment
        if(input.substr(state.current, 4) === "<!--") {
          lexComment(state);
          continue;
        }
    
        // It's a tag
        lexTag(state);
      }
    }
    
    var lexText = function(state) {
      var current = state.current;
      var input = state.input;
    
      var endOfText = input.substring(current).search(tagOrCommentStartRE);
    
      if(endOfText === -1) {
        // Only Text
        state.tokens.push({
          type: "text",
          value: escapeString(input.slice(current))
        });
        state.current = input.length;
        return;
      } else if(endOfText !== 0) {
        // End of Text Found
        endOfText += current;
        state.tokens.push({
          type: "text",
          value: escapeString(input.slice(current, endOfText))
        });
        state.current = endOfText;
      }
    }
    
    var lexComment = function(state) {
      var current = state.current;
      var input = state.input;
      var length = input.length;
    
      current += 4;
    
      var endOfComment = input.indexOf("-->", current);
    
      if(endOfComment === -1) {
        // Only an unclosed comment
        state.tokens.push({
          type: "comment",
          value: input.slice(current)
        });
        state.current = length;
      } else {
        // End of Comment Found
        state.tokens.push({
          type: "comment",
          value: input.slice(current, endOfComment)
        });
        state.current = endOfComment + 3;
      }
    }
    
    var lexTag = function(state) {
      var input = state.input;
    
      // Lex starting tag
      var isClosingStart = input.charAt(state.current + 1) === "/";
      state.current += isClosingStart === true ? 2 : 1;
    
      // Lex type and attributes
      var tagToken = lexTagType(state);
      lexAttributes(tagToken, state);
    
      // Lex ending tag
      var isClosingEnd = input.charAt(state.current) === "/";
      state.current += isClosingEnd === true ? 2 : 1;
    
      // Check if closing start
      if(isClosingStart === true) {
        tagToken.closeStart = true;
      }
    
      // Check if closing end
      if(isClosingEnd === true) {
        tagToken.closeEnd = true;
      }
    }
    
    var lexTagType = function(state) {
      var input = state.input;
      var length = input.length;
      var current = state.current;
      var tagType = "";
      while(current < length) {
        var char = input.charAt(current);
        if((char === "/") || (char === ">") || (char === " ")) {
          break;
        } else {
          tagType += char;
        }
        current++;
      }
    
      var tagToken = {
        type: "tag",
        value: tagType
      };
    
      state.tokens.push(tagToken);
    
      state.current = current;
      return tagToken;
    }
    
    var lexAttributes = function(tagToken, state) {
      var input = state.input;
      var length = input.length;
      var current = state.current;
      var char = input.charAt(current);
      var nextChar = input.charAt(current + 1);
    
      var incrementChar = function() {
        current++;
        char = input.charAt(current);
        nextChar = input.charAt(current + 1);
      }
    
      var attributes = {};
    
      while(current < length) {
        // If it is the end of a tag, exit
        if((char === ">") || (char === "/" && nextChar === ">")) {
          break;
        }
    
        // If there is a space, skip
        if(char === " ") {
          incrementChar();
          continue;
        }
    
        // Get the name of the attribute
        var attrName = "";
        var noValue = false;
    
        while(current < length && char !== "=") {
          if((char === " ") || (char === ">") || (char === "/" && nextChar === ">")) {
            noValue = true;
            break;
          } else {
            attrName += char;
          }
          incrementChar();
        }
    
        var attrValue = {
          name: attrName,
          value: "",
          meta: {}
        }
    
        if(noValue === true) {
          attributes[attrName] = attrValue;
          continue;
        }
    
        // Exit Equal Sign
        incrementChar();
    
        // Get the type of quote used
        var quoteType = " ";
        if(char === "'" || char === "\"") {
          quoteType = char;
    
          // Exit the quote
          incrementChar();
        }
    
        // Find the end of it
        while(current < length && char !== quoteType) {
          attrValue.value += char;
          incrementChar();
        }
    
        // Exit the end of it
        incrementChar();
    
        // Check for an Argument
        var argIndex = attrName.indexOf(":");
        if(argIndex !== -1) {
          var splitAttrName = attrName.split(":");
          attrValue.name = splitAttrName[0];
          attrValue.meta.arg = splitAttrName[1];
        }
    
        // Setup the Value
        attributes[attrName] = attrValue;
      }
    
      state.current = current;
      tagToken.attributes = attributes;
    }
    
    var parse = function(tokens) {
      var root = {
        type: "ROOT",
        children: []
      }
    
      var state = {
        current: 0,
        tokens: tokens
      }
    
      while(state.current < tokens.length) {
        var child = parseWalk(state);
        if(child) {
          root.children.push(child);
        }
      }
    
      return root;
    }
    
    var HTML_ELEMENTS = ["address", "article", "aside", "footer", "header", "h1", "h2", "h3", "h4", "h5", "h6", "hgroup", "nav", "section", "div", "dd", "dl", "dt", "figcaption", "figure", "picture", "li", "main", "ol", "p", "pre", "ul", "a", "b", "abbr", "bdi", "bdo", "cite", "code", "data", "dfn", "em", "i", "kbd", "mark", "q", "rp", "rt", "rtc", "ruby", "s", "samp", "small", "span", "strong", "sub", "sup", "time", "u", "var", "audio", "map", "video", "object", "canvas", "del", "ins", "caption", "col", "colgroup", "table", "thead", "tbody", "td", "th", "tr", "button", "datalist", "fieldset", "form", "label", "legend", "meter", "optgroup", "option", "output", "progress", "select", "textarea", "details", "dialog", "menu", "menuitem", "summary", "content", "element", "shadow", "template", "blockquote", "iframe", "tfoot"];
    var VOID_ELEMENTS = ["area", "base", "br", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
    var SVG_ELEMENTS = ["svg", "animate", "circle", "clippath", "cursor", "defs", "desc", "ellipse", "filter", "font-face", "foreignObject", "g", "glyph", "image", "line", "marker", "mask", "missing-glyph", "path", "pattern", "polygon", "polyline", "rect", "switch", "symbol", "text", "textpath", "tspan", "use", "view"];
    
    var createParseNode = function(type, props, children) {
      return {
        type: type,
        props: props,
        children: children
      }
    }
    
    var parseWalk = function(state) {
      var token = state.tokens[state.current];
      var previousToken = state.tokens[state.current - 1];
    
      var move = function(num) {
        state.current += num === undefined ? 1 : num;
        token = state.tokens[state.current];
        previousToken = state.tokens[state.current - 1];
      }
    
      if(token.type === "text") {
        move();
        return previousToken.value;
      }
    
      if(token.type === "comment") {
        move();
        return undefined;
      }
    
      // Start of new Tag
      if(token.type === "tag") {
        var tagType = token.value;
        var closeStart = token.closeStart;
        var closeEnd = token.closeEnd;
    
        var isSVGElement = SVG_ELEMENTS.indexOf(tagType) !== -1;
        var isVoidElement = VOID_ELEMENTS.indexOf(tagType) !== -1 || closeEnd === true;
    
        var node = createParseNode(tagType, token.attributes, []);
    
        move();
    
        // If it is an svg element, let code generator know
        if(isSVGElement === true) {
          node.isSVG = true;
        }
    
        if(isVoidElement === true) {
          // Self closing, don't process further
          return node;
        } else if(closeStart === true) {
          // Unmatched closing tag on non void element
          if("development" !== "production") {
            error(("Could not locate opening tag for the element \"" + (node.type) + "\""));
          }
          return undefined;
        } else if(token !== undefined) {
          // Check for custom tag
          if(HTML_ELEMENTS.indexOf(tagType) === -1) {
            node.custom = true;
          }
    
          // Match all children
          while((token.type !== "tag") || ((token.type === "tag") && ((token.closeStart === undefined && token.closeEnd === undefined) || (token.value !== tagType)))) {
            var parsedChildState = parseWalk(state);
            if(parsedChildState !== undefined) {
              node.children.push(parsedChildState);
            }
    
            move(0);
    
            if(token === undefined) {
              // No token means a tag was left unclosed
              if("development" !== "production") {
                error(("The element \"" + (node.type) + "\" was left unclosed"));
              }
              break;
            }
          }
    
          move();
        }
    
        return node;
      }
    
      move();
      return;
    }
    
    var closeCall = function(code, add) {
      return code.substring(0, code.length - 2) + add;
    }
    
    var generateProps = function(node, parent, specialDirectivesAfter, state) {
      var props = node.props;
      node.props = {
        attrs: props
      }
    
      var hasAttrs = false;
    
      var hasDirectives = false;
      var directiveProps = [];
    
      var propKey;
      var specialDirective;
    
      var propsCode = "{attrs: {";
    
      var beforeGenerate;
      for(propKey in props) {
        var prop = props[propKey];
        var name = prop.name;
        if((specialDirective = specialDirectives[name]) !== undefined && (beforeGenerate = specialDirective.beforeGenerate) !== undefined) {
          beforeGenerate(prop, node, parent, state);
        }
      }
    
      var afterGenerate;
      var duringPropGenerate;
      for(propKey in props) {
        var prop$1 = props[propKey];
        var name$1 = prop$1.name;
    
        specialDirective = specialDirectives[name$1]
        if(specialDirective !== undefined) {
          afterGenerate = specialDirective.afterGenerate;
          if(afterGenerate !== undefined) {
            specialDirectivesAfter[name$1] = {
              prop: prop$1,
              afterGenerate: afterGenerate
            };
          }
    
          duringPropGenerate = specialDirective.duringPropGenerate;
          if(duringPropGenerate !== undefined) {
            var generated = duringPropGenerate(prop$1, node, parent, state);
    
            if(generated.length !== 0) {
              if(hasAttrs === false) {
                hasAttrs = true;
              }
    
              propsCode += generated;
            }
          }
    
          node.meta.shouldRender = 1;
        } else if(name$1[0] === "m" && name$1[1] === "-") {
          if(hasDirectives === false) {
            hasDirectives = true;
          }
    
          directiveProps.push(prop$1);
          node.meta.shouldRender = 1;
        } else {
          var value = prop$1.value;
          var compiled = compileTemplate(value, state.exclude, state.dependencies);
    
          if(value !== compiled) {
            node.meta.shouldRender = 1;
          }
    
          if(hasAttrs === false) {
            hasAttrs = true;
          }
    
          propsCode += "\"" + propKey + "\": \"" + compiled + "\", ";
        }
      }
    
      if(hasAttrs === true) {
        propsCode = closeCall(propsCode, "}");
      } else {
        propsCode += "}";
      }
    
      if(hasDirectives === true) {
        propsCode += ", directives: {";
    
        for(var i = 0; i < directiveProps.length; i++) {
          var directiveProp = directiveProps[i];
          var directivePropValue = directiveProp.value;
    
          compileTemplateExpression(directivePropValue, state.exclude, state.dependencies);
          propsCode += "\"" + (directiveProp.name) + "\": " + (directivePropValue.length === 0 ? "\"\"" : directivePropValue) + ", ";
        }
    
        propsCode = closeCall(propsCode, "}");
      }
    
      var domProps = node.props.dom;
      if(domProps !== undefined) {
        propsCode += ", dom: {";
    
        for(var domProp in domProps) {
          propsCode += "\"" + domProp + "\": " + (domProps[domProp]) + ", ";
        }
    
        propsCode = closeCall(propsCode, "}");
      }
    
      propsCode += "}, ";
    
      return propsCode;
    }
    
    var generateEventlisteners = function(eventListeners) {
      var eventListenersCode = "\"eventListeners\": {";
    
      for(var type in eventListeners) {
        var handlers = eventListeners[type];
        eventListenersCode += "\"" + type + "\": [";
    
          for(var i = 0; i < handlers.length; i++) {
            eventListenersCode += (handlers[i]) + ", ";
          }
    
          eventListenersCode = closeCall(eventListenersCode, "], ");
        }
    
        eventListenersCode = closeCall(eventListenersCode, "}, ");
        return eventListenersCode;
    }
    
    var generateMeta = function(meta) {
      var metaCode = "{";
      var hasMeta = false;
    
      for(var key in meta) {
        if(key === "eventListeners") {
          metaCode += generateEventlisteners(meta[key])
        } else {
          metaCode += "\"" + key + "\": " + (meta[key]) + ", ";
        }
        hasMeta = true;
      }
    
      if(hasMeta === true) {
        metaCode = closeCall(metaCode, "}, ");
      } else {
        metaCode += "}, ";
      }
    
      return metaCode;
    }
    
    var generateNode = function(node, parent, index, state) {
      if(typeof node === "string") {
        var compiled = compileTemplate(node, state.exclude, state.dependencies);
        var meta = {};
    
        if(node !== compiled) {
          meta.shouldRender = 1;
          parent.meta.shouldRender = 1;
        } else if(state.dynamic === true) {
          meta.shouldRender = 1;
        }
    
        return ("m(\"#text\", " + (generateMeta(meta)) + "\"" + compiled + "\")");
      } else if(node.type === "m-insert") {
        parent.meta.shouldRender = 1;
        parent.deep = true;
    
        return "instance.insert";
      } else {
        var call = "m(\"" + (node.type) + "\", ";
        state.index = index;
    
        var meta$1 = {};
        node.meta = meta$1;
    
        if(node.custom === true || state.dynamic === true) {
          meta$1.shouldRender = 1;
        }
    
        if(node.isSVG === true) {
          meta$1.isSVG = 1;
        }
    
        var specialDirectivesAfter = {};
        var propsCode = generateProps(node, parent, specialDirectivesAfter, state);
    
        var children = node.children;
        var childrenCode = "[";
    
        if(children.length === 0) {
          childrenCode += "]";
        } else {
          for(var i = 0; i < children.length; i++) {
            childrenCode += (generateNode(children[i], node, i, state)) + ", ";
          }
          childrenCode = closeCall(childrenCode, "]");
        }
    
        if(node.deep === true) {
          childrenCode = "[].concat.apply([], " + childrenCode + ")";
        }
    
        if(meta$1.shouldRender === 1 && parent !== undefined) {
          parent.meta.shouldRender = 1;
        }
    
        call += propsCode;
        call += generateMeta(meta$1);
        call += childrenCode;
        call += ")";
    
        for(var specialDirectiveKey in specialDirectivesAfter) {
          var specialDirectiveAfter = specialDirectivesAfter[specialDirectiveKey];
          call = specialDirectiveAfter.afterGenerate(specialDirectiveAfter.prop, call, node, parent, state);
        }
    
        return call;
      }
    }
    
    var generate = function(tree) {
      var root = tree.children[0];
    
      var state = {
        index: 0,
        dynamic: false,
        exclude: globals,
        dependencies: []
      };
    
      var rootCode = generateNode(root, undefined, 0, state);
    
      var dependencies = state.dependencies;
      var dependenciesCode = "";
    
      for(var i = 0; i < dependencies.length; i++) {
        var dependency = dependencies[i];
        dependenciesCode += "var " + dependency + " = instance.get(\"" + dependency + "\"); ";
      }
    
      var code = "var instance = this; " + dependenciesCode + "return " + rootCode + ";";
    
      try {
        return new Function("m", code);
      } catch(e) {
        error("Could not create render function");
        return noop;
      }
    }
    
    var compile = function(template) {
      var tokens = lex(template);
      var ast = parse(tokens);
      return generate(ast);
    }
    
    
    function Moon(options) {
        /* ======= Initial Values ======= */
    
        // Options
        if(options === undefined) {
          options = {};
        }
        this.options = options;
    
        // Readable name/id
        defineProperty(this, "name", options.name, "root");
    
        // DOM Node to Mount
        this.root = undefined;
    
        // Custom Data
        var data = options.data;
        if(data === undefined) {
          this.data = {};
        } else if(typeof data === "function") {
          this.data = data();
        } else {
          this.data = data;
        }
    
        // Render function
        defineProperty(this, "compiledRender", options.render, noop);
    
        // Hooks
        defineProperty(this, "hooks", options.hooks, {});
    
        // Custom Methods
        var methods = options.methods;
        if(methods !== undefined) {
          initMethods(this, methods);
        }
    
        // Events
        this.events = {};
    
        // Virtual DOM
        this.dom = {};
    
        // Observer
        this.observer = new Observer(this);
    
        // State of Queue
        this.queued = true;
    
        // Setup Computed Properties
        var computed = options.computed;
        if(computed !== undefined) {
          initComputed(this, computed);
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
    Moon.prototype.get = function(key) {
      // Collect dependencies if currently collecting
      var observer = this.observer;
      var map = observer.map;
      var target = observer.target;
    
      if(target !== undefined) {
        if(map[key] === undefined) {
          map[key] = [target];
        } else if(map[key].indexOf(target) === -1) {
          map[key].push(target);
        }
      }
    
      // Return value
      if("development" !== "production" && this.data.hasOwnProperty(key) === false) {
        error(("The item \"" + key + "\" was referenced but not defined"));
      }
      return this.data[key];
    }
    
    /**
     * Sets Value in Data
     * @param {String|Object} key
     * @param {Any} value
     */
    Moon.prototype.set = function(key, value) {
      // Get observer
      var observer = this.observer;
    
      if(typeof key === "object") {
        // Shallow merge
        var data = this.data;
        for(var prop in key) {
          // Set value
          data[prop] = key[prop];
    
          // Notify observer of change
          observer.notify(prop);
        }
      } else {
        // Set value
        this.data[key] = value;
    
        // Notify observer of change
        observer.notify(key);
      }
    
      // Queue a build
      queueBuild(this);
    }
    
    /**
     * Destroys Moon Instance
     */
    Moon.prototype.destroy = function() {
      // Remove event listeners
      this.off();
    
      // Remove reference to element
      delete this.root.__moon__;
      this.root = undefined;
    
      // Queue
      this.queued = true;
    
      // Call destroyed hook
      callHook(this, "destroyed");
    }
    
    /**
     * Calls a method
     * @param {String} method
     * @return {Any} output of method
     */
    Moon.prototype.callMethod = function(method, args) {
      // Get arguments
      args = args || [];
    
      // Call method in context of instance
      return this.data[method].apply(this, args);
    }
    
    // Event Emitter, adapted from https://github.com/kbrsh/voke
    
    /**
     * Attaches an Event Listener
     * @param {String} eventName
     * @param {Function} handler
     */
    Moon.prototype.on = function(eventName, handler) {
      // Get list of handlers
      var handlers = this.events[eventName];
    
      if(handlers === undefined) {
        // If no handlers, create them
        this.events[eventName] = [handler];
      } else {
        // If there are already handlers, add it to the list of them
        handlers.push(handler);
      }
    }
    
    /**
     * Removes an Event Listener
     * @param {String} eventName
     * @param {Function} handler
     */
    Moon.prototype.off = function(eventName, handler) {
      if(eventName === undefined) {
        // No event name provided, remove all events
        this.events = {};
      } else if(handler === undefined) {
        // No handler provided, remove all handlers for the event name
        this.events[eventName] = [];
      } else {
        // Get handlers from event name
        var handlers = this.events[eventName];
    
        // Get index of the handler to remove
        var index = handlers.indexOf(handler);
    
        // Remove the handler
        handlers.splice(index, 1);
      }
    }
    
    /**
     * Emits an Event
     * @param {String} eventName
     * @param {Object} customMeta
     */
    Moon.prototype.emit = function(eventName, customMeta) {
      // Setup metadata to pass to event
      var meta = customMeta || {};
      meta.type = eventName;
    
      // Get handlers and global handlers
      var handlers = this.events[eventName];
      var globalHandlers = this.events['*'];
    
      // Counter
      var i = 0;
    
      // Call all handlers for the event name
      if(handlers !== undefined) {
        for(i = 0; i < handlers.length; i++) {
          handlers[i](meta);
        }
      }
    
      if(globalHandlers !== undefined) {
        // Call all of the global handlers if present
        for(i = 0; i < globalHandlers.length; i++) {
          globalHandlers[i](meta);
        }
      }
    }
    
    /**
     * Mounts Moon Element
     * @param {String|Object} root
     */
    Moon.prototype.mount = function(root) {
      // Get element from the DOM
      this.root = typeof root === "string" ? document.querySelector(root) : root;
    
      if("development" !== "production" && this.root === null) {
        // Element not found
        error("Element " + this.options.root + " not found");
      }
    
      // Sync Element and Moon instance
      this.root.__moon__ = this;
    
      // Setup template as provided `template` or outerHTML of the Element
      defineProperty(this, "template", this.options.template, this.root.outerHTML);
    
      // Setup render Function
      if(this.compiledRender === noop) {
        this.compiledRender = Moon.compile(this.template);
      }
    
      // Remove queued state
      this.queued = false;
    
      // Run First Build
      this.build();
    
      // Call mounted hook
      callHook(this, "mounted");
    }
    
    /**
     * Renders Virtual DOM
     * @return {Object} Virtual DOM
     */
    Moon.prototype.render = function() {
      // Call render function
      return this.compiledRender(m);
    }
    
    /**
     * Diff then Patches Nodes With Data
     * @param {Object} old
     * @param {Object} vnode
     * @param {Object} parent
     */
    Moon.prototype.patch = function(old, vnode, parent) {
      if(old.meta !== undefined) {
        // If it is a VNode, then diff
        if(vnode.type !== old.type) {
          // Root element changed during diff
          var oldRoot = old.meta.node;
    
          // Replace root element
          var newRoot = createNodeFromVNode(vnode);
          parent.replaceChild(newRoot, oldRoot);
    
          // Update Bound Instance
          newRoot.__moon__ = this;
          this.root = newRoot;
        } else {
          // Diff
          diff(old, vnode, 0, parent, {});
        }
    
      } else if(old instanceof Node) {
        // Hydrate
        if(old.nodeName.toLowerCase() !== vnode.type) {
          // Root element changed, replace it
          var newRoot$1 = createNodeFromVNode(vnode);
          parent.replaceChild(newRoot$1, old);
    
          // Update bound instance
          newRoot$1.__moon__ = this;
          this.root = newRoot$1;
        } else {
          hydrate(old, vnode, parent);
        }
      }
    }
    
    /**
     * Render and Patches the DOM With Data
     */
    Moon.prototype.build = function() {
      // Get new virtual DOM
      var dom = this.render();
    
      // Old item to patch
      var old;
    
      if(this.dom.meta !== undefined) {
        // If old virtual dom exists, patch against it
        old = this.dom;
      } else {
        // No virtual DOM, patch with actual DOM element, and setup virtual DOM
        old = this.root;
        this.dom = dom;
      }
    
      // Patch old and new
      this.patch(old, dom, this.root.parentNode);
    }
    
    /**
     * Initializes Moon
     */
    Moon.prototype.init = function() {
      log("======= Moon =======");
      callHook(this, "init");
    
      var root = this.options.root;
      if(root !== undefined) {
        this.mount(root);
      }
    }
    
    
    /* ======= Global API ======= */
    
    /**
     * Configuration of Moon
     */
    Moon.config = {
      silent: ("development" === "production") || (typeof console === 'undefined'),
      keyCodes: function(keyCodes) {
        extend(eventModifiers, keyCodes);
      }
    }
    
    /**
     * Version of Moon
     */
    Moon.version = '0.11.0';
    
    /**
     * Moon Utilities
     */
    Moon.util = {
      noop: noop,
      error: error,
      log: log,
      extend: extend,
      m: m
    }
    
    /**
     * Runs an external Plugin
     * @param {Object} plugin
     * @param {Object} options
     */
    Moon.use = function(plugin, options) {
      plugin.init(Moon, options);
    }
    
    /**
     * Compiles HTML to a Render Function
     * @param {String} template
     * @return {Function} render function
     */
    Moon.compile = function(template) {
      return compile(template);
    }
    
    /**
     * Runs a Task After Update Queue
     * @param {Function} task
     */
    Moon.nextTick = function(task) {
      setTimeout(task, 0);
    }
    
    /**
     * Creates a Directive
     * @param {String} name
     * @param {Function} action
     */
    Moon.directive = function(name, action) {
      directives["m-" + name] = action;
    }
    
    /**
     * Creates a Component
     * @param {String} name
     * @param {Object} options
     */
    Moon.component = function(name, options) {
      var Parent = this;
    
      if(options.name !== undefined) {
        name = options.name;
      } else {
        options.name = name;
      }
    
      if(options.data !== undefined && typeof options.data !== "function") {
        error("In components, data must be a function returning an object");
      }
    
      function MoonComponent(componentOptions) {
        var this$1 = this;
    
        Moon.apply(this, [options]);
    
        if(componentOptions === undefined) {
          this.insert = [];
        } else {
          var props = componentOptions.props;
          this.insert = componentOptions.insert;
    
          if(props !== undefined) {
            for(var prop in props) {
              this$1.data[prop] = props[prop];
            }
          }
        }
      }
    
      MoonComponent.prototype = Object.create(Parent.prototype);
      MoonComponent.prototype.constructor = MoonComponent;
    
      MoonComponent.prototype.init = function() {
        var options = this.options;
    
        var template = options.template;
        this.template = template;
    
        if(this.compiledRender === noop) {
          this.compiledRender = Moon.compile(template);
        }
    
        callHook(this, "init");
      }
    
      components[name] = {
        CTor: MoonComponent,
        options: options
      };
    
      return MoonComponent;
    }
    
    
    /* ======= Default Directives ======= */
    
    var emptyVNode = "m(\"#text\", {}, \"\")";
    
    var ifDynamic = 0;
    var ifStack = [];
    var forStack = [];
    
    var setIfState = function(state) {
      if(state.dynamic === false) {
        state.dynamic = true;
      } else {
        ifDynamic++;
      }
    }
    
    var addEventListenerCodeToVNode = function(name, handler, vnode) {
      var meta = vnode.meta;
      var eventListeners = meta.eventListeners;
      if(eventListeners === undefined) {
        eventListeners = meta.eventListeners = {};
      }
      var eventHandlers = eventListeners[name];
      if(eventHandlers === undefined) {
        eventListeners[name] = [handler];
      } else {
        eventHandlers.push(handler);
      }
    }
    
    var addDomPropertyCodeToVNode = function(name, code, vnode) {
      var dom = vnode.props.dom;
      if(dom === undefined) {
        vnode.props.dom = dom = {};
      }
      dom[name] = code;
    }
    
    specialDirectives["m-if"] = {
      beforeGenerate: function(prop, vnode, parentVNode, state) {
        var children = parentVNode.children;
        var index = state.index;
    
        for(var i = index + 1; i < children.length; i++) {
          var child = children[i];
          if(typeof child !== "string") {
            var attrs = child.props;
            if(attrs["m-else"] !== undefined) {
              ifStack.push([i, child]);
              children.splice(i, 1);
              setIfState(state);
            } else if(attrs["m-if"] !== undefined) {
              setIfState(state);
            }
            break;
          }
        }
      },
      afterGenerate: function(prop, code, vnode, parentVNode, state) {
        var value = prop.value;
        var children = parentVNode.children;
        var elseValue = emptyVNode;
        var elseNode = ifStack.pop();
    
        if(elseNode !== undefined) {
          elseValue = generateNode(elseNode[1], parentVNode, elseNode[0], state);
        }
    
        if((--ifDynamic) === 0) {
          state.dynamic = false;
        }
    
        compileTemplateExpression(value, state.exclude, state.dependencies);
    
        return (value + " ? " + code + " : " + elseValue);
      }
    };
    
    specialDirectives["m-else"] = {
    
    };
    
    specialDirectives["m-for"] = {
      beforeGenerate: function(prop, vnode, parentVNode, state) {
        // Setup Deep Flag to Flatten Array
        parentVNode.deep = true;
    
        // Parts
        var parts = prop.value.split(" in ");
    
        // Aliases
        var aliases = parts[0];
    
        // Iteratable
        var iteratable = parts[1];
        var exclude = state.exclude;
        forStack.push([iteratable, aliases, exclude]);
        state.exclude = exclude.concat(aliases.split(","));
        compileTemplateExpression(iteratable, exclude, state.dependencies);
      },
      afterGenerate: function(prop, code, vnode, parentVNode, state) {
        // Get node with information about parameters
        var node = forStack.pop();
    
        // Restore globals to exclude
        state.exclude = node[2];
    
        // Use the renderLoop runtime helper
        return ("m.renderLoop(" + (node[0]) + ", function(" + (node[1]) + ") { return " + code + "; })");
      }
    };
    
    specialDirectives["m-on"] = {
      beforeGenerate: function(prop, vnode, parentVNode, state) {
        // Get list of modifiers
        var modifiers = prop.meta.arg.split(".");
        var eventType = modifiers.shift();
    
        // Get method to call
        var methodToCall = prop.value;
    
        // Default parameters
        var params = "event";
    
        // Compile given parameters
        var paramStart = methodToCall.indexOf("(");
        if(paramStart !== -1) {
          var paramEnd = methodToCall.lastIndexOf(")");
          params = methodToCall.substring(paramStart + 1, paramEnd);
          methodToCall = methodToCall.substring(0, paramStart);
          compileTemplateExpression(params, state.exclude, state.dependencies);
        }
    
        // Generate any modifiers
        var modifiersCode = "";
        for(var i = 0; i < modifiers.length; i++) {
          var modifier = modifiers[i];
          var eventModifierCode = eventModifiersCode[modifier];
          if(eventModifierCode === undefined) {
            modifiersCode += "if(m.renderEventModifier(event.keyCode, \"" + modifier + "\") === false) {return null;};"
          } else {
            modifiersCode += eventModifierCode;
          }
        }
    
        // Generate event listener code and install handler
        var code = "function(event) {" + modifiersCode + "instance.callMethod(\"" + methodToCall + "\", [" + params + "])}";
        addEventListenerCodeToVNode(eventType, code, vnode);
      }
    };
    
    specialDirectives["m-model"] = {
      beforeGenerate: function(prop, vnode, parentVNode, state) {
        // Get attributes
        var value = prop.value;
        var attrs = vnode.props.attrs;
    
        // Get exclusions
        var exclude = state.exclude;
    
        // Get dependencies
        var dependencies = state.dependencies;
    
        // Add dependencies
        compileTemplateExpression(value, exclude, dependencies);
    
        // Setup default event type, keypath to set, value of setter, DOM property to change, and value of DOM property
        var eventType = "input";
        var domGetter = "value";
        var domSetter = value;
        var keypathGetter = value;
        var keypathSetter = "event.target." + domGetter;
    
        // If input type is checkbox, listen on 'change' and change the 'checked' DOM property
        var type = attrs.type;
        if(type !== undefined) {
          type = type.value;
          var radio = false;
          if(type === "checkbox" || (type === "radio" && (radio = true))) {
            eventType = "change";
            domGetter = "checked";
    
            if(radio === true) {
              var valueAttr = attrs.value;
              var literalValueAttr;
              var valueAttrValue = "null";
              if(valueAttr !== undefined) {
                valueAttrValue = "\"" + (compileTemplate(valueAttr.value, exclude, dependencies)) + "\"";
              } else if((literalValueAttr = attrs["m-literal:value"])) {
                valueAttrValue = "" + (compileTemplate(literalValueAttr.value, exclude, dependencies));
              }
              domSetter += "=== " + valueAttrValue;
              keypathSetter = valueAttrValue;
            } else {
              keypathSetter = "event.target." + domGetter;
            }
          }
        }
    
        // Generate the listener
        var code = "function(event) {instance.set(\"" + keypathGetter + "\", " + keypathSetter + ")}";
    
        // Push the listener to it's event listeners
        addEventListenerCodeToVNode(eventType, code, vnode);
    
        // Setup a query used to get the value, and set the corresponding dom property
        addDomPropertyCodeToVNode(domGetter, domSetter, vnode);
      }
    };
    
    specialDirectives["m-literal"] = {
      duringPropGenerate: function(prop, vnode, parent, state) {
        var modifiers = prop.meta.arg.split(".");
    
        var propName = modifiers.shift();
        var propValue = prop.value;
    
        compileTemplateExpression(propValue, state.exclude, state.dependencies);
    
        if(modifiers[0] === "dom") {
          addDomPropertyCodeToVNode(propName, propValue, vnode);
          return "";
        } else if(propName === "class") {
          // Detected class, use runtime class render helper
          return ("\"class\": m.renderClass(" + propValue + "), ");
        } else {
          // Default literal attribute
          return ("\"" + propName + "\": " + propValue + ", ");
        }
      }
    };
    
    specialDirectives["m-mask"] = {
    
    };
    
    directives["m-show"] = function(el, val, vnode) {
      el.style.display = (val ? '' : 'none');
    };
    
    
    return Moon;
}));
