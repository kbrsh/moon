/**
 * Moon v0.11.0
 * Copyright 2016-2017 Kabir Shah
 * Released under the MIT License
 * http://moonjs.ga
 */

(function(root, factory) {
  /* ======= Global Moon ======= */
  if(typeof module === "undefined") {
    root.Moon = factory();
  } else {
    module.exports = factory();
  }
}(this, function() {
    "use strict";
    
    /* ======= Global Variables ======= */
    var directives = {};
    var specialDirectives = {};
    var components = {};
    
    /* ======= Utilities ======= */
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
     * No Operation
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
      var handle = function(event) {
        var handlers = handle.handlers;
        for(var i = 0; i < handlers.length; i++) {
          handlers[i](event);
        }
      }
    
      // Add handlers to handle
      handle.handlers = eventListeners[type];
    
      // Add handler to VNode
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
    var createNode = function(vnode) {
      var type = vnode.type;
      var meta = vnode.meta;
      var node;
    
      if(type === "#text") {
        // Create textnode
        node = document.createTextNode(vnode.value);
      } else {
        var children = vnode.children;
        node = meta.SVG === 1 ? document.createElementNS("http://www.w3.org/2000/svg", type) : document.createElement(type);
    
        // Append all children
        for(var i = 0; i < children.length; i++) {
          appendChild(children[i], node);
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
     * @param {Object} vnode
     * @param {Object} parent
     */
    var appendChild = function(vnode, parent) {
      // New Component
      var component = vnode.meta.component;
      if(component === undefined) {
        // Create node
        var node = createNode(vnode);
    
        // Append node
        parent.appendChild(node);
      } else {
        // Create node
        var node$1 = document.createElement(vnode.type);
    
        // Append node
        parent.appendChild(node$1);
    
        // Create Component
        createComponent(node$1, vnode, component);
      }
    }
    
    /**
     * Removes a Child, Ensuring Components are Unmounted
     * @param {Object} node
     * @param {Object} parent
     */
    var removeChild = function(node, parent) {
      // Check for Existing Component
      var componentInstance = node.__moon__;
      if(componentInstance !== undefined) {
        // Destroy existing component
        componentInstance.destroy();
      }
    
      // Remove the Node
      parent.removeChild(node);
    }
    
    /**
     * Replaces a Child, Ensuring Components are Unmounted/Mounted
     * @param {Object} node
     * @param {Object} vnode
     * @param {Object} parent
     */
    var replaceChild = function(node, vnode, parent) {
      // Check for Existing Component
      var componentInstance = node.__moon__;
      if(componentInstance !== undefined) {
        // Destroy existing component
        componentInstance.destroy();
      }
    
      // New Component
      var component = vnode.meta.component;
      if(component === undefined) {
        // Create node
        var newNode = createNode(vnode);
    
        // Replace the node
        parent.replaceChild(newNode, node);
      } else {
        createComponent(node, vnode, component);
      }
    }
    
    /**
     * Creates a Virtual DOM Node
     * @param {String} type
     * @param {Object} props
     * @param {Object} meta
     * @param {Array} children
     * @return {Object} Virtual DOM Node
     */
    var createVNode = function(type, props, meta, children) {
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
    var createTextVNode = function(value, meta) {
      return {
        type: "#text",
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
    
      if(type === "#text") {
        // Text Node
        // Type => #text
        // Meta => props
        // Value => meta
        return createTextVNode(meta, props);
      } else if((component = components[type]) !== undefined) {
        // Resolve Component
        if(component.options.functional === true) {
          return createFunctionalComponent(props, children, component);
        } else {
          meta.component = component;
        }
      }
    
      return createVNode(type, props, meta, children);
    
      // VNode Structure
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
     * Empty Text Node
     */
    m.emptyVNode = m("#text", {}, '');
    
    /**
     * Renders a Class in Array/Object Form
     * @param {Array|Object|String} classNames
     * @return {String} renderedClassNames
     */
    m.renderClass = function(classNames) {
      if(typeof classNames === "string") {
        return classNames;
      } else {
        var renderedClassNames = '';
        if(Array.isArray(classNames)) {
          // It's an array, so go through them all and generate a string
          for(var i = 0; i < classNames.length; i++) {
            renderedClassNames += " " + (m.renderClass(classNames[i]));
          }
        } else if(typeof classNames === "object") {
          // It's an object, so to through and render them to a string if the corresponding condition is truthy
          for(var className in classNames) {
            if(classNames[className]) {
              renderedClassNames += " " + className;
            }
          }
        }
    
        renderedClassNames = renderedClassNames.substring(1);
        return renderedClassNames;
      }
    }
    
    /**
     * Renders "m-for" Directive Array
     * @param {Array|Object|Number} iteratable
     * @param {Function} item
     */
    m.renderLoop = function(iteratable, item) {
      var items;
    
      if(Array.isArray(iteratable)) {
        var length = iteratable.length;
        items = new Array(length);
        for(var i = 0; i < length; i++) {
          items[i] = item(iteratable[i], i);
        }
      } else if(typeof iteratable === "object") {
        items = [];
        for(var key in iteratable) {
          items.push(item(iteratable[key], key));
        }
      } else if(typeof iteratable === "number") {
        items = new Array(iteratable);
        for(var i$1 = 0; i$1 < iteratable; i$1++) {
          items[i$1] = item(i$1 + 1, i$1);
        }
      }
    
      return items;
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
    var createComponent = function(node, vnode, component) {
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
    
      // Create component options
      var componentOptions = {
        root: node,
        props: data,
        insert: vnode.children
      };
    
      // Check for events
      var eventListeners = vnode.meta.eventListeners;
      if(eventListeners !== undefined) {
        componentOptions.events = eventListeners;
      }
    
      // Initialize and mount instance
      var componentInstance = new component.CTor(componentOptions);
    
      // Rehydrate
      vnode.meta.node = componentInstance.root;
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
    
        if((vnodePropValue !== false) && (nodePropValue === undefined || vnodePropValue !== nodePropValue)) {
          if(vnodePropName === "xlink:href") {
            node.setAttributeNS("http://www.w3.org/1999/xlink", "href", vnodePropValue);
          } else {
            node.setAttribute(vnodePropName, vnodePropValue === true ? '' : vnodePropValue);
          }
        }
      }
    
      // Diff Node Props with VNode Props
      for(var nodePropName in nodeProps) {
        var vnodePropValue$1 = vnodeProps[nodePropName];
        if(vnodePropValue$1 === undefined || vnodePropValue$1 === false) {
          node.removeAttribute(nodePropName);
        }
      }
    
      // Execute any directives
      var vnodeDirectives = props.directives;
      if(vnodeDirectives !== undefined) {
        for(var directiveName in vnodeDirectives) {
          var directive = directives[directiveName];
          if(directive !== undefined) {
            directive(node, vnodeDirectives[directiveName], vnode);
          } else if("development" !== "production") {
            error(("Could not find directive \"" + directiveName + "\""));
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
        createComponent(node, vnode, vnode.meta.component);
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
        replaceChild(node, vnode, parent);
      } else if(vnode.type === "#text") {
        // Both are text nodes, update if needed
        if(node.textContent !== vnode.value) {
          node.textContent = vnode.value;
        }
    
        // Hydrate
        meta.node = node;
      } else if((component = meta.component) !== undefined) {
        // Component
        createComponent(node, vnode, component);
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
          var child = length === 0 ? undefined : children[0];
          var nextSibling = null;
    
          while(child !== undefined || currentChildNode !== null) {
            if(currentChildNode === null) {
              nextSibling = null;
              appendChild(children[i$1], node);
            } else {
              nextSibling = currentChildNode.nextSibling;
              if(i$1 >= length) {
                removeChild(currentChildNode, node);
              } else {
                hydrate(currentChildNode, children[i$1], node);
              }
            }
            child = ++i$1 < length ? children[i$1] : undefined;
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
        replaceChild(oldMeta.node, vnode, parent);
      } else if(meta.dynamic !== undefined) {
        if(vnode.type === "#text") {
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
            var oldEventListeners = oldMeta.eventListeners;
            for(var type in eventListeners) {
              oldEventListeners[type].handlers = eventListeners[type];
            }
          }
    
          // Ensure innerHTML and textContent weren't changed
          var domProps = props.dom;
          if(domProps === undefined || (domProps.innerHTML === undefined && domProps.textContent === undefined)) {
            // Diff children
            var children = vnode.children;
            var oldChildren = oldVNode.children;
            var newLength = children.length;
            var oldLength = oldChildren.length;
    
            if(newLength === 0) {
              var firstChild;
              while((firstChild = node.firstChild) !== null) {
                removeChild(firstChild, node);
              }
              oldVNode.children = [];
            } else if(oldLength === 0) {
              for(var i = 0; i < newLength; i++) {
                appendChild(children[i], node);
              }
              oldVNode.children = children;
            } else {
              var totalLen = newLength > oldLength ? newLength : oldLength;
              var oldChild;
              var child;
              for(var i$1 = 0; i$1 < totalLen; i$1++) {
                if(i$1 >= newLength) {
                  // Remove extra child
                  removeChild(oldChildren.pop().meta.node, node);
                } else if(i$1 >= oldLength) {
                  // Add extra child
                  child = children[i$1];
                  appendChild(child, node);
                  oldChildren.push(child);
                } else {
                  // Diff child if they don't have the same reference
                  oldChild = oldChildren[i$1];
                  child = children[i$1];
    
                  if(oldChild !== child) {
                    diff(oldChild, child, i$1, node, oldVNode);
                  }
                }
              }
            }
          }
        }
      }
    }
    
    
    /* ======= Observer ======= */
    var initMethods = function(instance, methods) {
      var instanceMethods = instance.methods;
    
      var initMethod = function(methodName, method) {
        // Change context of method
        instanceMethods[methodName] = function() {
          return method.apply(instance, arguments);
        }
      }
    
      for(var method in methods) {
        initMethod(method, methods[method]);
      }
    }
    
    var initComputed = function(instance, computed) {
      var setComputedProperty = function(prop) {
        var observer = instance.observer;
        var option = computed[prop];
        var getter = option.get;
        var setter = option.set;
    
        // Add getter/setter
        Object.defineProperty(instance.data, prop, {
          get: function() {
            // Property Cache
            var cache;
    
            if(observer.cache[prop] === undefined) {
              // Capture dependencies
              observer.target = prop;
    
              // Invoke getter
              cache = getter.call(instance);
    
              // Stop capturing dependencies
              observer.target = undefined;
    
              // Store value in cache
              observer.cache[prop] = cache;
            } else {
              // Use cached value
              cache = observer.cache[prop];
            }
    
            return cache;
          },
          set: setter === undefined ? noop : function(val) {
            setter.call(instance, val);
          }
        });
      }
    
      // Set all computed properties
      for(var propName in computed) {
        setComputedProperty(propName);
      }
    }
    
    function Observer() {
      // Property currently being observed
      this.target = undefined;
      
      // Computed property cache
      this.cache = {};
    
      // Dependency Map
      this.map = {};
    }
    
    Observer.prototype.notify = function(key) {
      var this$1 = this;
    
      // Notify all dependent keys
      var map = this.map[key];
      if(map !== undefined) {
        for(var i = 0; i < map.length; i++) {
          this$1.notify(map[i]);
        }
      }
    
      // Clear cache for key
      var cache = this.cache;
      if(cache[key] !== undefined) {
        cache[key] = undefined;
      }
    }
    
    
    /* ======= Compiler ======= */
    // Concatenation Symbol
    var concatenationSymbol = " + ";
    
    // Opening delimiter
    var openRE = /\{\{\s*/;
    
    // Closing delimiter
    var closeRE = /\s*\}\}/;
    
    // Whitespace character
    var whitespaceCharRE = /[\s\n]/;
    
    // All whitespace
    var whitespaceRE = /[\s\n]/g;
    
    // Start of a tag or comment
    var tagOrCommentStartRE = /<\/?(?:[A-Za-z]+\w*)|<!--/;
    
    // Dynamic expressions
    var expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)(?:\s*\()?/g;
    
    // HTML Escapes
    var escapeRE = /(?:(?:&(?:lt|gt|quot|amp);)|"|\\|\n)/g;
    var escapeMap = {
      "&lt;": '<',
      "&gt;": '>',
      "&quot;": "\\\"",
      "&amp;": '&',
      '\\': "\\\\",
      '"': "\\\"",
      '\n': "\\n"
    }
    
    // Global Variables/Keywords
    var globals = ["true", "false", "undefined", "null", "NaN", "typeof", "in", "event"];
    
    // HTML, Void, and SVG Elements
    var HTML_ELEMENTS = ["a", "abbr", "address", "article", "aside", "audio", "b", "bdi", "bdo", "blockquote", "button", "canvas", "caption", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "i", "iframe", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "menu", "menuitem", "meter", "nav", "object", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "rtc", "ruby", "s", "samp", "section", "select", "shadow", "small", "span", "strong", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "u", "ul", "var", "video"];
    var VOID_ELEMENTS = ["area", "base", "br", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
    var SVG_ELEMENTS = ["animate", "circle", "clippath", "cursor", "defs", "desc", "ellipse", "filter", "font-face", "foreignObject", "g", "glyph", "image", "line", "marker", "mask", "missing-glyph", "path", "pattern", "polygon", "polyline", "rect", "svg", "switch", "symbol", "text", "textpath", "tspan", "use", "view"];
    
    var compileTemplateExpression = function(expression, exclude, dependencies) {
      var props = dependencies.props;
      var methods = dependencies.methods;
      var dynamic = false;
      var info;
    
      while((info = expressionRE.exec(expression)) !== null) {
        var match = info[0];
        var name = info[1];
        if(name !== undefined && exclude.indexOf(name) === -1) {
          if(match[match.length - 1] === "(") {
            if(methods.indexOf(name) === -1) {
              methods.push(name);
            }
          } else if(props.indexOf(name) === -1) {
            props.push(name);
            dynamic = true;
          }
        }
      }
    
      return dynamic;
    }
    
    var compileTemplate = function(template, exclude, dependencies) {
      var length = template.length;
      var current = 0;
      var dynamic = false;
      var output = '';
    
      while(current < length) {
        // Match text
        var textTail = template.substring(current);
        var textMatch = textTail.match(openRE);
    
        if(textMatch === null) {
          output += "\"" + textTail + "\"";
          break;
        } else {
          var textIndex = textMatch.index;
          if(textIndex !== 0) {
            output += "\"" + (textTail.substring(0, textIndex)) + "\"";
            current += textIndex;
          }
    
          dynamic = true;
        }
    
        // Concatenate if not at the start
        if(current !== 0) {
          output += concatenationSymbol;
        }
    
        // Exit opening delimiter
        current += textMatch[0].length;
    
        // Get expression, and exit closing delimiter
        var expressionTail = template.substring(current);
        var expressionMatch = expressionTail.match(closeRE);
    
        if("development" !== "production" && expressionMatch === null) {
          error(("Expected closing delimiter after \"" + expressionTail + "\""));
        } else {
          var expressionIndex = expressionMatch.index;
          var expression = expressionTail.substring(0, expressionIndex);
          compileTemplateExpression(expression, exclude, dependencies);
          output += "(" + expression + ")";
          current += expression.length + expressionMatch[0].length;
    
          // Concatenate if not at the end
          if(current !== length) {
            output += concatenationSymbol;
          }
        }
      }
    
      return {
        output: output,
        dynamic: dynamic
      };
    }
    
    var lex = function(template) {
      var length = template.length;
      var tokens = [];
      var current = 0;
    
      while(current < length) {
        var char = template[current];
        if(char === '<') {
          current++;
          if(template.substring(current, current + 3) === "!--") {
            // Comment
            current += 3;
            var endOfComment = template.indexOf("-->", current);
            if(endOfComment === -1) {
              current = length;
            } else {
              current = endOfComment + 3;
            }
          } else {
            // Tag
            var tagToken = {
              type: "Tag",
              value: ''
            }
    
            var tagType = '';
            var attributes = {};
    
            var closeStart = false;
            var closeEnd = false;
    
            char = template[current];
    
            // Exit starting closing slash
            if(char === '/') {
              char = template[++current];
              closeStart = true;
            }
    
            // Get tag name
            while((current < length) && ((char !== '>') && (char !== '/') && (whitespaceCharRE.test(char) === false))) {
              tagType += char;
              char = template[++current];
            }
    
            // Iterate to end of tag
            while((current < length) && ((char !== '>') && (char !== '/' || template[current + 1] !== '>'))) {
              if(whitespaceCharRE.test(char) === true) {
                // Skip whitespace
                char = template[++current];
              } else {
                // Find attribute name
                var attrName = '';
                var attrValue = '';
                while((current < length) && ((char !== '=') && (whitespaceCharRE.test(char) === false) && ((char !== '>') && (char !== '/' || template[current + 1] !== '>')))) {
                  attrName += char;
                  char = template[++current];
                }
    
                // Find attribute value
                if(char === '=') {
                  char = template[++current];
    
                  var quoteType = ' ';
                  if(char === '"' || char === '\'' || char === ' ' || char === '\n') {
                    quoteType = char;
                    char = template[++current];
                  }
    
                  // Iterate to end of quote type, or end of tag
                  while((current < length) && ((char !== '>') && (char !== '/' || template[current + 1] !== '>'))) {
                    if(char === quoteType) {
                      char = template[++current];
                      break;
                    } else {
                      attrValue += char;
                      char = template[++current];
                    }
                  }
                }
    
                var attrToken = {
                  name: attrName,
                  value: attrValue,
                  arg: undefined,
                  data: {}
                }
    
                var splitAttrName = attrName.split(':');
                if(splitAttrName.length === 2) {
                  attrToken.name = splitAttrName[0];
                  attrToken.arg = splitAttrName[1];
                }
    
                attributes[attrName] = attrToken;
              }
            }
    
            if(char === '/') {
              current += 2;
              closeEnd = true;
            } else {
              current++;
            }
    
            tagToken.value = tagType;
            tagToken.attributes = attributes;
            tagToken.closeStart = closeStart;
            tagToken.closeEnd = closeEnd;
            tokens.push(tagToken);
          }
        } else {
          // Text
          var textTail = template.substring(current);
          var endOfText = textTail.search(tagOrCommentStartRE);
          var text = (void 0);
          if(endOfText === -1) {
            text = textTail;
            current = length;
          } else {
            text = textTail.substring(0, endOfText);
            current += endOfText;
          }
          if(text.replace(whitespaceRE, '').length !== 0) {
            tokens.push({
              type: "Text",
              value: text.replace(escapeRE, function(match) {
                return escapeMap[match];
              })
            });
          }
        }
      }
    
      return tokens;
    }
    
    var parse = function(tokens) {
      var root = {
        type: "ROOT",
        props: {},
        children: []
      }
      var elements = [root];
      var lastIndex = 0;
    
      for(var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        if(token.type === "Text") {
          // Push text to currently pending element
          elements[lastIndex].children.push(token.value);
        } else if(token.type === "Tag") {
          // Tag found
          if(token.closeStart === true) {
            if("development" !== "production" && token.value !== elements[lastIndex].type) {
              error(("The element \"" + (elements[lastIndex].type) + "\" was left unclosed"));
            }
            // Closing tag found, close current element
            elements.pop();
            lastIndex--;
          } else {
            // Opening tag found, create element
            var type = token.value;
            var node = {
              type: type,
              props: {
                attrs: token.attributes
              },
              children: []
            };
            elements[lastIndex].children.push(node);
    
            if(token.closeEnd === false && VOID_ELEMENTS.indexOf(type) === -1) {
              if(SVG_ELEMENTS.indexOf(type) !== -1) {
                node.SVG = true;
              } else if(HTML_ELEMENTS.indexOf(type) === -1) {
                node.custom = true;
              }
    
              elements.push(node);
              lastIndex++;
            }
          }
        }
      }
    
      return root.children[0];
    }
    
    var closeCall = function(code, add) {
      return code.substring(0, code.length - 2) + add;
    }
    
    var generateProps = function(node, parent, specialDirectivesAfter, state) {
      var props = node.props.attrs;
    
      var dynamic = false;
    
      var hasAttrs = false;
    
      var hasDirectives = false;
      var directiveProps = [];
    
      var propName;
      var specialDirective;
    
      var propsCode = "{\"attrs\": {";
    
      var beforeGenerate;
      for(propName in props) {
        var prop = props[propName];
        var name = prop.name;
        if((specialDirective = specialDirectives[name]) !== undefined && (beforeGenerate = specialDirective.beforeGenerate) !== undefined) {
          beforeGenerate(prop, node, parent, state);
        }
      }
    
      var afterGenerate;
      var duringPropGenerate;
      for(propName in props) {
        var prop$1 = props[propName];
        var name$1 = prop$1.name;
    
        specialDirective = specialDirectives[name$1];
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
              hasAttrs = true;
              propsCode += generated;
            }
          }
        } else if(name$1[0] === 'm' && name$1[1] === '-') {
          hasDirectives = true;
          dynamic = true;
          directiveProps.push(prop$1);
        } else {
          var value = prop$1.value;
          var compiled = compileTemplate(value, state.exclude, state.dependencies);
    
          if(compiled.dynamic === true) {
            dynamic = true;
          }
    
          hasAttrs = true;
          propsCode += "\"" + propName + "\": " + (compiled.output) + ", ";
        }
      }
    
      if(state.static === false && dynamic === true) {
        node.meta.dynamic = 1;
      }
    
      if(hasAttrs === true) {
        propsCode = closeCall(propsCode, '}');
      } else {
        propsCode += '}';
      }
    
      if(hasDirectives === true) {
        propsCode += ", \"directives\": {";
    
        for(var i = 0; i < directiveProps.length; i++) {
          var directiveProp = directiveProps[i];
          var directivePropValue = directiveProp.value;
    
          compileTemplateExpression(directivePropValue, state.exclude, state.dependencies);
          propsCode += "\"" + (directiveProp.name) + "\": " + (directivePropValue.length === 0 ? "\"\"" : directivePropValue) + ", ";
        }
    
        propsCode = closeCall(propsCode, '}');
      }
    
      var domProps = node.props.dom;
      if(domProps !== undefined) {
        propsCode += ", \"dom\": {";
    
        for(var domPropName in domProps) {
          propsCode += "\"" + domPropName + "\": " + (domProps[domPropName]) + ", ";
        }
    
        propsCode = closeCall(propsCode, '}');
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
      var metaCode = '{';
      var hasMeta = false;
    
      for(var key in meta) {
        if(key === "eventListeners") {
          metaCode += generateEventlisteners(meta[key]);
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
    
        if(state.static === false) {
          if(compiled.dynamic === true || state.dynamic === true) {
            meta.dynamic = 1;
            parent.meta.dynamic = 1;
          }
        }
    
        return ("m(\"#text\", " + (generateMeta(meta)) + (compiled.output) + ")");
      } else if(node.type === "m-insert") {
        if(state.static === false) {
          parent.meta.dynamic = 1;
        }
    
        parent.deep = true;
    
        return "instance.insert";
      } else {
        var call = "m(\"" + (node.type) + "\", ";
        state.index = index;
    
        var meta$1 = {};
        node.meta = meta$1;
    
        if((state.static === false) && (node.custom === true || state.dynamic === true)) {
          meta$1.dynamic = 1;
        }
    
        if(node.SVG === true) {
          meta$1.SVG = 1;
        }
    
        var specialDirectivesAfter = {};
        var propsCode = generateProps(node, parent, specialDirectivesAfter, state);
    
        var children = node.children;
        var childrenCode = '[';
    
        if(children.length === 0) {
          childrenCode += ']';
        } else {
          for(var i = 0; i < children.length; i++) {
            childrenCode += (generateNode(children[i], node, i, state)) + ", ";
          }
          childrenCode = closeCall(childrenCode, ']');
        }
    
        if(node.deep === true) {
          childrenCode = "[].concat.apply([], " + childrenCode + ")";
        }
    
        if(meta$1.dynamic === 1 && parent !== undefined) {
          parent.meta.dynamic = 1;
        }
    
        call += propsCode;
        call += generateMeta(meta$1);
        call += childrenCode;
        call += ')';
    
        for(var specialDirectiveName in specialDirectivesAfter) {
          var specialDirectiveAfter = specialDirectivesAfter[specialDirectiveName];
          call = specialDirectiveAfter.afterGenerate(specialDirectiveAfter.prop, call, node, parent, state);
        }
    
        return call;
      }
    }
    
    var generate = function(tree) {
      var state = {
        index: 0,
        dynamic: false,
        static: false,
        exclude: globals,
        dependencies: {
          props: [],
          methods: []
        }
      };
    
      var treeCode = generateNode(tree, undefined, 0, state);
      var dependencies = state.dependencies;
      var props = dependencies.props;
      var methods = dependencies.methods;
      var dependenciesCode = '';
      var i = 0;
    
      for(; i < props.length; i++) {
        var propName = props[i];
        dependenciesCode += "var " + propName + " = instance.get(\"" + propName + "\");";
      }
    
      for(i = 0; i < methods.length; i++) {
        var methodName = methods[i];
        dependenciesCode += "var " + methodName + " = instance.methods[\"" + methodName + "\"];";
      }
    
      var code = "var instance = this;" + dependenciesCode + "return " + treeCode + ";";
    
      try {
        return new Function('m', code);
      } catch(e) {
        error("Could not create render function");
        return noop;
      }
    }
    
    var compile = function(template) {
      var tokens = lex(template);
      var tree = parse(tokens);
      return generate(tree);
    }
    
    
    function Moon(options) {
      /* ======= Initial Values ======= */
    
      // Options
      if(options === undefined) {
        options = {};
      }
      this.options = options;
    
      // Name/ID
      defineProperty(this, "name", options.name, "Root");
    
      // Root DOM Node
      this.root = undefined;
    
      // Data
      var data = options.data;
      if(data === undefined) {
        this.data = {};
      } else if(typeof data === "function") {
        this.data = data();
      } else {
        this.data = data;
      }
    
      // Methods
      var methods = options.methods;
      this.methods = {};
      if(methods !== undefined) {
        initMethods(this, methods);
      }
    
      // Compiled render function
      defineProperty(this, "compiledRender", options.render, noop);
    
      // Hooks
      defineProperty(this, "hooks", options.hooks, {});
    
      // Events
      this.events = {};
    
      // Virtual DOM
      this.dom = {};
    
      // Observer
      this.observer = new Observer();
    
      // Queued state
      this.queued = true;
    
      // Initialize computed properties
      var computed = options.computed;
      if(computed !== undefined) {
        initComputed(this, computed);
      }
    
      // Initialize
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
    
    // Event Emitter, adapted from https://github.com/kbrsh/voke
    
    /**
     * Attaches an Event Listener
     * @param {String} eventName
     * @param {Function} handler
     */
    Moon.prototype.on = function(eventName, handler) {
      var events = this.events;
      var handlers = events[eventName];
    
      if(handlers === undefined) {
        // Create handler
        events[eventName] = [handler];
      } else {
        // Add handler
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
      // Events
      var events = this.events;
    
      // Setup metadata to pass to event
      var meta = {};
      if(customMeta !== undefined) {
        meta = customMeta;
      }
    
      meta.type = eventName;
    
      // Get handlers and global handlers
      var handlers = events[eventName];
      var globalHandlers = events['*'];
    
      // Counter
      var i;
    
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
    Moon.prototype.mount = function(rootOption) {
      // Get element from the DOM
      var root = this.root = typeof rootOption === "string" ? document.querySelector(rootOption) : rootOption;
      if("development" !== "production" && root === null) {
        error("Element " + this.options.root + " not found");
      }
    
      // Sync Element and Moon instance
      root.__moon__ = this;
    
      // Setup template as provided `template` or outerHTML of the node
      defineProperty(this, "template", this.options.template, root.outerHTML);
    
      // Setup render Function
      if(this.compiledRender === noop) {
        this.compiledRender = Moon.compile(this.template);
      }
    
      // Remove queued state
      this.queued = false;
    
      // Build
      this.build();
    
      // Call mounted hook
      callHook(this, "mounted");
    }
    
    /**
     * Renders Virtual DOM
     * @return {Object} Virtual DOM
     */
    Moon.prototype.render = function() {
      return this.compiledRender(m);
    }
    
    /**
     * Renders and Patches the DOM
     */
    Moon.prototype.build = function() {
      var root = this.root;
      var dom = this.render();
      var old = this.dom;
    
      if(old.meta === undefined) {
        // Hydrate
        if(root.nodeName.toLowerCase() === dom.type) {
          hydrate(root, dom, root.parentNode);
        } else {
          var newRoot = createNode(dom);
          root.parentNode.replaceChild(newRoot, root);
    
          newRoot.__moon__ = this;
          this.root = newRoot;
        }
    
        this.dom = dom;
      } else {
        // Diff
        if(dom.type === old.type) {
          diff(old, dom, 0, root.parentNode, {});
        } else {
          var newRoot$1 = createNode(dom);
          root.parentNode.replaceChild(newRoot$1, root);
    
          newRoot$1.__moon__ = this;
          this.root = newRoot$1;
        }
      }
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
      silent: ("development" === "production") || (typeof console === "undefined")
    }
    
    /**
     * Version of Moon
     */
    Moon.version = "0.11.0";
    
    /**
     * Moon Utilities
     */
    Moon.util = {
      noop: noop,
      log: log,
      error: error,
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
    Moon.extend = function(name, options) {
      var optionsName = options.name;
      if(optionsName === undefined) {
        options.name = name;
      } else {
        name = optionsName;
      }
    
      if(options.data !== undefined && typeof options.data !== "function") {
        error("In components, data must be a function returning an object");
      }
    
      function MoonComponent(componentOptions) {
        this.componentOptions = componentOptions;
        Moon.apply(this, [options]);
      }
    
      MoonComponent.prototype = Object.create(this.prototype);
      MoonComponent.prototype.constructor = MoonComponent;
    
      MoonComponent.prototype.init = function() {
        var componentOptions = this.componentOptions;
        var root;
        
        if(componentOptions === undefined) {
          this.insert = [];
        } else {
          root = componentOptions.root;
          var props = componentOptions.props;
          var events = componentOptions.events;
          this.insert = componentOptions.insert;
    
          if(props !== undefined) {
            var data = this.data;
            for(var prop in props) {
              data[prop] = props[prop];
            }
          }
    
          if(events !== undefined) {
            this.events = events;
          }
        }
    
        callHook(this, "init");
        if(root !== undefined) {
          this.mount(root);
        }
      }
    
      components[name] = {
        CTor: MoonComponent,
        options: options
      };
    
      return MoonComponent;
    }
    
    
    /* ======= Default Directives ======= */
    var hashRE = /\.|\[/;
    
    var addEventListenerCodeToNode = function(name, handler, node) {
      var meta = node.meta;
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
    
    var addDomPropertyCodeToNode = function(name, code, node) {
      var dom = node.props.dom;
      if(dom === undefined) {
        node.props.dom = dom = {};
      }
    
      dom[name] = code;
    }
    
    specialDirectives["m-if"] = {
      beforeGenerate: function(prop, node, parentNode, state) {
        var children = parentNode.children;
        var index = state.index;
    
        for(var i = index + 1; i < children.length; i++) {
          var child = children[i];
          if(typeof child !== "string") {
            var data = prop.data;
            var attrs = child.props.attrs;
    
            if(attrs["m-else"] !== undefined) {
              data.elseNode = [i, child];
              children.splice(i, 1);
    
              if(state.dynamic === false) {
                state.dynamic = true;
                data.ifSetDynamic = true;
              }
            }
    
            break;
          }
        }
    
        node.meta.dynamic = 1;
      },
      afterGenerate: function(prop, code, node, parentNode, state) {
        var value = prop.value;
        var data = prop.data;
        var elseValue = "m.emptyVNode";
        var elseNode = data.elseNode;
    
        compileTemplateExpression(value, state.exclude, state.dependencies);
    
        if(elseNode !== undefined) {
          elseValue = generateNode(elseNode[1], parentNode, elseNode[0], state);
          if(data.ifSetDynamic === true) {
            state.dynamic = false;
          }
        }
    
        return (value + " ? " + code + " : " + elseValue);
      }
    };
    
    specialDirectives["m-for"] = {
      beforeGenerate: function(prop, node, parentNode, state) {
        // Setup Deep Flag to Flatten Array
        parentNode.deep = true;
    
        // Parts
        var parts = prop.value.split(" in ");
    
        // Aliases
        var aliases = parts[0];
    
        // Save information
        var iteratable = parts[1];
        var exclude = state.exclude;
        prop.data.forInfo = [iteratable, aliases, exclude];
        state.exclude = exclude.concat(aliases.split(','));
        compileTemplateExpression(iteratable, exclude, state.dependencies);
    
        // Mark as dynamic
        node.meta.dynamic = 1;
      },
      afterGenerate: function(prop, code, node, parentNode, state) {
        // Get information about parameters
        var forInfo = prop.data.forInfo;
    
        // Restore globals to exclude
        state.exclude = forInfo[2];
    
        // Use the renderLoop runtime helper
        return ("m.renderLoop(" + (forInfo[0]) + ", function(" + (forInfo[1]) + ") {return " + code + ";})");
      }
    };
    
    specialDirectives["m-on"] = {
      beforeGenerate: function(prop, node, parentNode, state) {
        // Get event type
        var eventType = prop.arg;
    
        // Get method code
        var methodCode = prop.value;
        if(methodCode.indexOf('(') === -1) {
          methodCode += "(event)";
        }
    
        // Compile method code
        if(compileTemplateExpression(methodCode, state.exclude, state.dependencies) === true) {
          node.meta.dynamic = 1;
        }
    
        // Generate event listener code and install handler
        addEventListenerCodeToNode(eventType, ("function(event) {" + methodCode + ";}"), node);
      }
    };
    
    specialDirectives["m-bind"] = {
      beforeGenerate: function(prop, node, parentNode, state) {
        var value = prop.value;
    
        compileTemplateExpression(value, state.exclude, state.dependencies);
    
        var dynamicIndex = value.search(hashRE);
        var base;
        var properties;
        if(dynamicIndex !== -1) {
          base = value.substring(0, dynamicIndex);
          properties = value.substring(dynamicIndex);
          value = "instance.get(\"" + base + "\")" + properties;
        }
    
        var eventType = "input";
        var instanceKey = value;
        var instanceValue = "event.target.value";
        var domKey = "value";
        var domValue = value;
        var code = '';
    
        if(dynamicIndex === -1) {
          code = "function(event) {instance.set(\"" + instanceKey + "\", " + instanceValue + ");}";
        } else {
          code = "function(event) {var boundValue = instance.get(\"" + base + "\");boundValue" + properties + " = " + instanceValue + ";instance.set(\"" + base + "\", boundValue);}";
        }
    
        node.meta.dynamic = 1;
        addEventListenerCodeToNode(eventType, code, node);
        addDomPropertyCodeToNode(domKey, domValue, node);
      }
    };
    
    specialDirectives["m-literal"] = {
      duringPropGenerate: function(prop, node, parentNode, state) {
        var modifiers = prop.arg.split('.');
        var propName = modifiers.shift();
        var propValue = prop.value;
    
        if(compileTemplateExpression(propValue, state.exclude, state.dependencies) === true) {
          node.meta.dynamic = 1;
        }
    
        if(modifiers[0] === "dom") {
          // Literal DOM property
          addDomPropertyCodeToNode(propName, propValue, node);
          return '';
        } else if(propName === "class") {
          // Detect class at runtime
          return ("\"class\": m.renderClass(" + propValue + "), ");
        } else {
          // Literal attribute
          return ("\"" + propName + "\": " + propValue + ", ");
        }
      }
    };
    
    specialDirectives["m-static"] = {
      beforeGenerate: function(prop, node, parentNode, state) {
        if(state.static === false) {
          prop.data.staticSet = true;
          state.static = true;
        }
      },
      afterGenerate: function(prop, code, node, parentNode, state) {
        if(prop.data.staticSet === true) {
          state.static = false;
        }
    
        return code;
      }
    };
    
    specialDirectives["m-mask"] = {
    
    };
    
    directives["m-show"] = function(el, val, node) {
      el.style.display = (val ? '' : "none");
    };
    
    
    return Moon;
}));
