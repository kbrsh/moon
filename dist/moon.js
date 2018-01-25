/**
 * Moon v0.11.0
 * Copyright 2016-2018 Kabir Shah
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
    var log = function(msg) {
      if(Moon.config.silent === false) {
        console.log(msg);
      }
    }
    
    var error = function(msg) {
      if(Moon.config.silent === false) {
        console.error("[Moon] ERROR: " + msg);
      }
    }
    
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
    
    var callHook = function(instance, name) {
      var hook = instance.hooks[name];
      if(hook !== undefined) {
        hook.call(instance);
      }
    }
    
    var defineProperty = function(obj, prop, value, def) {
      if(value === undefined) {
        obj[prop] = def;
      } else {
        obj[prop] = value;
      }
    }
    
    var noop = function() {
      
    }
    
    var addEvents = function(node, events) {
      var loop = function ( eventType ) {
        // Create handle function
        var handle = function(event) {
          var handlers = handle.handlers;
          for(var i = 0; i < handlers.length; i++) {
            handlers[i](event);
          }
        }
    
        // Add handlers to handle
        handle.handlers = events[eventType];
    
        // Add handler to VNode
        events[eventType] = handle;
    
        // Add event listener
        node.addEventListener(eventType, handle);
      };
    
      for(var eventType in events) loop( eventType );
    }
    
    var createNode = function(vnode) {
      var type = vnode.type;
      var data = vnode.data;
      var node;
    
      if(type === "#text") {
        // Create textnode
        node = document.createTextNode(vnode.value);
      } else {
        var children = vnode.children;
        node = (data.flags & FLAG_SVG) === FLAG_SVG ? document.createElementNS("http://www.w3.org/2000/svg", type) : document.createElement(type);
    
        // Append all children
        for(var i = 0; i < children.length; i++) {
          appendVNode(children[i], node);
        }
    
        // Add all event listeners
        var events = data.events;
        if(events !== undefined) {
          addEvents(node, events);
        }
    
        // Add Props
        patchProps(node, undefined, vnode, vnode.props);
      }
    
      // Hydrate
      data.node = node;
    
      return node;
    }
    
    var createComponent = function(node, vnode, component) {
      var props = component.options.props;
      var attrs = vnode.props.attrs;
      var componentProps = {};
    
      // Get component props
      if(props !== undefined && attrs !== undefined) {
        for(var i = 0; i < props.length; i++) {
          var propName = props[i];
          componentProps[propName] = attrs[propName];
        }
      }
    
      // Create component options
      var componentOptions = {
        root: node,
        props: componentProps,
        insert: vnode.children
      };
    
      // Check for events
      var events = vnode.data.events;
      if(events === undefined) {
        componentOptions.events = {};
      } else {
        componentOptions.events = events;
      }
    
      // Initialize and mount instance
      var componentInstance = new component.CTor(componentOptions);
    
      // Update data
      var data = vnode.data;
      data.component = componentInstance;
      data.node = componentInstance.root;
    }
    
    var appendNode = function(node, parentNode) {
      parentNode.appendChild(node);
    }
    
    var appendVNode = function(vnode, parentNode) {
      var vnodeComponent = vnode.data.component;
    
      if(vnodeComponent === undefined) {
        appendNode(createNode(vnode), parentNode);
      } else {
        var root = document.createElement(vnode.type);
        appendNode(root, parentNode);
        createComponent(root, vnode, vnodeComponent);
      }
    }
    
    var removeNode = function(node, parentNode) {
      parentNode.removeChild(node);
    }
    
    var removeVNode = function(vnode, parentNode) {
      var vnodeData = vnode.data;
      var vnodeComponentInstance = vnodeData.component;
    
      if(vnodeComponentInstance !== undefined) {
        vnodeComponentInstance.destroy();
      }
    
      removeNode(vnodeData.node, parentNode);
    }
    
    var replaceNode = function(newNode, oldNode, parentNode) {
      parentNode.replaceChild(newNode, oldNode);
    }
    
    var replaceVNode = function(newVNode, oldVNode, parentNode) {
      var oldVNodeData = oldVNode.data;
      var oldVNodeComponentInstance = oldVNodeData.component;
    
      if(oldVNodeComponentInstance !== undefined) {
        oldVNodeComponentInstance.destroy();
      }
    
      var newVNodeComponent = newVNode.data.component;
      if(newVNodeComponent === undefined) {
        replaceNode(createNode(newVNode), oldVNodeData.node, parentNode);
      } else {
        createComponent(oldVNodeData.node, newVNode, newVNodeComponent);
      }
    }
    
    var m = function(type, props, data, children) {
      if(type === "#text") {
        // Text virtual node
        return {
          type: type,
          data: props,
          value: data
        };
      } else {
        var component = components[type];
        if(component !== undefined) {
          // Component
          data.component = component;
        }
    
        // Virtual node
        return {
          type: type,
          props: props,
          data: data,
          children: children
        };
      }
    };
    
    m.flatten = function(children) {
      for(var i = 0; i < children.length; ) {
        var child = children[i];
        if(Array.isArray(child) === true) {
          var childLength = child.length;
          child.unshift(i, 1);
          children.splice.apply(children, child);
          child.slice(2, 0);
          i += childLength;
        } else {
          i++;
        }
      }
    
      return children;
    }
    
    m.renderClass = function(classNames) {
      if(typeof classNames === "string") {
        // String class names are already processed
        return classNames;
      } else {
        var renderedClassNames = '';
        var separator = '';
        if(Array.isArray(classNames) === true) {
          // It's an array concatenate them
          for(var i = 0; i < classNames.length; i++) {
            renderedClassNames += separator + m.renderClass(classNames[i]);
            separator = ' ';
          }
        } else if(typeof classNames === "object") {
          // Object of classnames, concatenate if value is true
          for(var className in classNames) {
            if(classNames[className] === true) {
              renderedClassNames += separator + className;
              separator = ' ';
            }
          }
        }
    
        return renderedClassNames;
      }
    }
    
    m.renderLoop = function(iteratable, item) {
      var items;
    
      if(Array.isArray(iteratable)) {
        // Render array
        var length = iteratable.length;
        items = new Array(length);
        for(var i = 0; i < length; i++) {
          items[i] = item(iteratable[i], i);
        }
      } else if(typeof iteratable === "object") {
        // Render object
        items = [];
        for(var key in iteratable) {
          items.push(item(iteratable[key], key));
        }
      } else if(typeof iteratable === "number") {
        // Render range
        items = new Array(iteratable);
        for(var i$1 = 0; i$1 < iteratable; i$1++) {
          items[i$1] = item(i$1 + 1, i$1);
        }
      }
    
      return items;
    }
    
    var patchProps = function(node, nodeAttrs, vnode, props) {
      // Get VNode Attributes
      var vnodeAttrs = props.attrs;
    
      if(vnodeAttrs === undefined) {
        if(nodeAttrs !== undefined) {
          // Remove all
          for(var nodeAttrName in nodeAttrs) {
            node.removeAttribute(nodeAttrName);
          }
        }
      } else {
        if(nodeAttrs === undefined) {
          // Add all
          for(var vnodeAttrName in vnodeAttrs) {
            var vnodeAttrValue = vnodeAttrs[vnodeAttrName];
            node.setAttribute(vnodeAttrName, vnodeAttrValue === true ? '' : vnodeAttrValue);
          }
        } else {
          // Add
          for(var vnodeAttrName$1 in vnodeAttrs) {
            var vnodeAttrValue$1 = vnodeAttrs[vnodeAttrName$1];
            var nodeAttrValue = nodeAttrs[vnodeAttrName$1];
    
            if((vnodeAttrValue$1 !== false) && (nodeAttrValue === undefined || vnodeAttrValue$1 !== nodeAttrValue)) {
              node.setAttribute(vnodeAttrName$1, vnodeAttrValue$1 === true ? '' : vnodeAttrValue$1);
            }
          }
    
          // Remove
          for(var nodeAttrName$1 in nodeAttrs) {
            var vnodeAttrValue$2 = vnodeAttrs[nodeAttrName$1];
            if(vnodeAttrValue$2 === undefined || vnodeAttrValue$2 === false) {
              node.removeAttribute(nodeAttrName$1);
            }
          }
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
      var domProps = props.dom;
      if(domProps !== undefined) {
        for(var domPropName in domProps) {
          node[domPropName] = domProps[domPropName];
        }
      }
    }
    
    var patchEvents = function(newEvents, oldEvents) {
      // Update event handlers
      for(var eventType in newEvents) {
        oldEvents[eventType].handlers = newEvents[eventType];
      }
    }
    
    var patchChildren = function(newChildren, oldChildren, parentNode) {
      var newLength = newChildren.length;
      var oldLength = oldChildren.length;
      var totalLength = newLength > oldLength ? newLength : oldLength;
    
      for(var i = 0; i < totalLength; i++) {
        if(i >= newLength) {
          // Past length of new children, remove child
          removeVNode(oldChildren.pop(), parentNode);
        } else if(i >= oldLength) {
          // Past length of old children, append child
          appendVNode((oldChildren[i] = newChildren[i]), parentNode);
        } else {
          var newChild = newChildren[i];
          var oldChild = oldChildren[i];
    
          if(newChild !== oldChild) {
            var newChildType = newChild.type;
            if(newChildType !== oldChild.type) {
              // Types are different, replace child
              replaceVNode(newChild, oldChild, parentNode);
              oldChildren[i] = newChild;
            } else {
              var oldChildData = oldChild.data;
              var oldChildComponentInstance = oldChildData.component;
              if(oldChildComponentInstance !== undefined) {
                // Component found
                var componentChanged = false;
    
                var oldChildComponentInstanceProps = oldChildComponentInstance.options.props;
                if(oldChildComponentInstanceProps !== undefined) {
                  // Update component props
                  var newChildAttrs = newChild.props.attrs;
                  var oldChildComponentInstanceObserver = oldChildComponentInstance.observer;
                  var oldChildComponentInstanceData = oldChildComponentInstance.data;
    
                  for(var j = 0; j < oldChildComponentInstanceProps.length; j++) {
                    var oldChildComponentInstancePropName = oldChildComponentInstanceProps[j];
                    oldChildComponentInstanceData[oldChildComponentInstancePropName] = newChildAttrs[oldChildComponentInstancePropName];
                    oldChildComponentInstanceObserver.notify(oldChildComponentInstancePropName);
                  }
    
                  componentChanged = true;
                }
    
                // Patch component events
                var newChildEvents = newChild.data.events;
                if(newChildEvents !== undefined) {
                  patchEvents(newChildEvents, oldChildData.events);
                }
    
                // Add insert
                var newChildChildren = newChild.children;
                if(newChildChildren.length !== 0) {
                  oldChildComponentInstance.insert = newChildChildren;
                  componentChanged = true;
                }
    
                // Build component if changed
                if(componentChanged === true) {
                  oldChildComponentInstance.build();
                  callHook(oldChildComponentInstance, "updated");
                }
              } else if(newChildType === "#text") {
                // Text node, update value
                var newChildValue = newChild.value;
                oldChildData.node.textContent = newChildValue;
                oldChild.value = newChildValue;
              } else {
                // Patch child
                patch(newChild, oldChild);
              }
            }
          }
        }
      }
    }
    
    var hydrate = function(node, vnode) {
      var vnodeData = vnode.data;
    
      // Add reference to node
      vnodeData.node = node;
    
      // Patch props
      var vnodeProps = vnode.props;
      var nodeAttributes = node.attributes;
      var nodeAttrs = {};
      for(var i = 0; i < nodeAttributes.length; i++) {
        var nodeAttribute = nodeAttributes[i];
        nodeAttrs[nodeAttribute.name] = nodeAttribute.value;
      }
      patchProps(node, nodeAttrs, vnode, vnodeProps);
    
      // Add events
      var vnodeEvents = vnodeData.events;
      if(vnodeEvents !== undefined) {
        addEvents(node, vnodeEvents);
      }
    
      // Hydrate children
      var vnodeDomProps = vnodeProps.dom;
      if((vnodeDomProps === undefined) || (vnodeDomProps.innerHTML === undefined && vnodeDomProps.textContent === undefined)) {
        var vnodeChildren = vnode.children;
        var vnodeChildrenLength = vnodeChildren.length;
    
        var i$1 = 0;
    
        var childVNode = i$1 === vnodeChildrenLength ? undefined : vnodeChildren[i$1];
        var childNode = node.firstChild;
    
        while(childVNode !== undefined || childNode !== null) {
          if(childNode === null) {
            // Node doesn't exist, create and append a node
            appendVNode(childVNode, node);
          } else {
            var nextSibling = childNode.nextSibling;
    
            if(childVNode === undefined) {
              // No VNode, remove the node
              removeNode(childNode, node);
            } else {
              var childVNodeComponent = childVNode.data.component;
              if(childVNodeComponent !== undefined) {
                // Create a component
                createComponent(childNode, childVNode, childVNodeComponent);
              } else {
                var childVNodeType = childVNode.type;
                if(childNode.nodeName.toLowerCase() !== childVNodeType) {
                  // Different types, replace nodes
                  replaceNode(createNode(childVNode), childNode, node);
                } else if(childVNodeType === "#text") {
                  // Text node, update
                  childNode.textContent = childVNode.value;
                  childVNode.data.node = childNode;
                } else {
                  // Hydrate
                  hydrate(childNode, childVNode);
                }
              }
            }
    
            childNode = nextSibling;
          }
    
          childVNode = ++i$1 < vnodeChildrenLength ? vnodeChildren[i$1] : undefined;
        }
      }
    }
    
    var patch = function(newVNode, oldVNode) {
      var oldVNodeData = oldVNode.data;
      var oldVNodeNode = oldVNodeData.node;
    
      // Patch props
      var newVNodeProps = newVNode.props;
      patchProps(oldVNodeNode, oldVNode.props.attrs, newVNode, newVNodeProps);
      oldVNode.props = newVNodeProps;
    
      // Patch events
      var newVNodeEvents = newVNode.data.events;
      if(newVNodeEvents !== undefined) {
        patchEvents(newVNodeEvents, oldVNodeData.events);
      }
    
      // Patch children
      patchChildren(newVNode.children, oldVNode.children, oldVNodeNode);
    }
    
    
    /* ======= Observer ======= */
    var initMethods = function(instance, methods) {
      var instanceMethods = instance.methods;
      var loop = function ( methodName ) {
        // Change context of method
        instanceMethods[methodName] = function() {
          return methods[methodName].apply(instance, arguments);
        }
      };
    
      for(var methodName in methods) loop( methodName );
    }
    
    var initComputed = function(instance, computed) {
      // Set all computed properties
      var data = instance.data;
      var observer = instance.observer;
      var loop = function ( propName ) {
        var option = computed[propName];
        var getter = option.get;
        var setter = option.set;
    
        // Add getter/setter
        Object.defineProperty(data, propName, {
          get: function() {
            // Property Cache
            var cache;
    
            if(observer.cache[propName] === undefined) {
              // Capture dependencies
              observer.target = propName;
    
              // Invoke getter
              cache = getter.call(instance);
    
              // Stop capturing dependencies
              observer.target = undefined;
    
              // Store value in cache
              observer.cache[propName] = cache;
            } else {
              // Use cached value
              cache = observer.cache[propName];
            }
    
            return cache;
          },
          set: setter === undefined ? noop : function(val) {
            setter.call(instance, val);
          }
        });
      };
    
      for(var propName in computed) loop( propName );
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
    
    // Tag start
    // Group 1: `/` or `""` (empty string)
    var tagStartRE = /^<\s*(\/?)\s*/i;
    
    // Tag name
    // Group 1: tag name
    var tagNameRE = /^([_A-Z][_A-Z\d\-\.]*)\s*/i;
    
    // Attribute name
    // Group 1: attribute name
    // Group 2: `=` or `""` (empty string)
    var attrNameRE = /^([_A-Z][_A-Z\d\-\.:]*)\s*(=?)\s*/i;
    
    // Attribute value
    // Group 1: quote type. `"` or `'`
    var attrValueRE = /^(["']?)(.*?)\1\s*/i;
    
    // Tag end
    // Group 1: `/` or `""` (empty string)
    var tagEndRE = /^(\/?)\s*>/i;
    
    // Opening delimiter
    var openRE = /\{\{\s*/;
    
    // Closing delimiter
    var closeRE = /\s*\}\}/;
    
    // Whitespace character
    var whitespaceCharRE = /[\s]/;
    
    // All whitespace
    var whitespaceRE = /[\s]/g;
    
    // Start of a tag or comment
    var tagOrCommentStartRE = /<\/?(?:[A-Z]+\w*)|<!--/i;
    
    // Dynamic expressions
    var expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)(?:\s*\()?/g;
    
    // HTML Escapes
    var escapeRE = /(?:(?:&(?:amp|gt|lt|nbsp|quot);)|"|\\|\n)/g;
    var escapeMap = {
      "&amp;": '&',
      "&gt;": '>',
      "&lt;": '<',
      "&nbsp;": ' ',
      "&quot;": "\\\"",
      '\\': "\\\\",
      '"': "\\\"",
      '\n': "\\n"
    }
    
    // Global Variables/Keywords
    var globals = ["NaN", "false", "in", "instance", 'm', "null", "staticNodes", "true", "typeof", "undefined"];
    
    // Void and SVG Elements
    var VOID_ELEMENTS = ["area", "base", "br", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
    var SVG_ELEMENTS = ["animate", "circle", "clippath", "cursor", "defs", "desc", "ellipse", "filter", "font-face", "foreignObject", "g", "glyph", "image", "line", "marker", "mask", "missing-glyph", "path", "pattern", "polygon", "polyline", "rect", "svg", "switch", "symbol", "text", "textpath", "tspan", "use", "view"];
    
    // Data Flags
    var FLAG_STATIC = 1;
    var FLAG_SVG = 1 << 1;
    
    // Trim Whitespace
    var trimWhitespace = function(value) {
      return value.replace(whitespaceRE, '');
    }
    
    var compileTemplateExpression = function(expression, state) {
      var dependencies = state.dependencies;
      var props = dependencies.props;
      var methods = dependencies.methods;
    
      var exclude = state.exclude;
      var locals = state.locals;
    
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
          } else {
            if(locals.indexOf(name) === -1 && props.indexOf(name) === -1) {
              props.push(name);
            }
    
            dynamic = true;
          }
        }
      }
    
      return dynamic;
    }
    
    var compileTemplate = function(template, state) {
      var length = template.length;
      var current = 0;
      var dynamic = false;
      var output = '';
    
      if(length === 0) {
        output = "\"\"";
      } else {
        while(current < length) {
          // Match text
          var textTail = template.substring(current);
          var textMatch = textTail.match(openRE);
    
          if(textMatch === null) {
            // Only static text
            output += "\"" + textTail + "\"";
            break;
          }
    
          var textIndex = textMatch.index;
          if(textIndex !== 0) {
            // Add static text and move to template expression
            output += "\"" + (textTail.substring(0, textIndex)) + "\"";
            current += textIndex;
          }
    
          // Mark as dynamic
          dynamic = true;
    
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
            // Add expression
            var expressionIndex = expressionMatch.index;
            var expression = expressionTail.substring(0, expressionIndex);
            compileTemplateExpression(expression, state);
            output += "(" + expression + ")";
            current += expression.length + expressionMatch[0].length;
    
            // Concatenate if not at the end
            if(current !== length) {
              output += concatenationSymbol;
            }
          }
        }
      }
    
      return {
        output: output,
        dynamic: dynamic
      };
    }
    
    /**
     * Check if the template is at the start of a comment.
     *
     * @param {String} template HTML string we are analysing.
     *
     * @return {Boolean} True if it is the start of a comment, false otherwise.
     */
    var isComment = function(template) {
      return template.substr(0, 4) === "<!--";
    }
    
    /**
     * Gets the comment from the start of the template.
     *
     * @param {String} template HTML string to get the comment from.
     *
     * @return {String} Whole string of the comment. Including `<!--` and `-->`.
     */
    var getComment = function(template) {
      var commentEnd = template.indexOf("-->", 4);
    
      // Endless comment
      if(commentEnd === -1) {
        return template;
      }
    
      return template.substring(0, commentEnd + 3);
    }
    
    /**
     * Get attributes from HTML.
     *
     * @param {String} template HTML string to get attributes from.
     *
     * @return {Object} An object containing two properties. `attributes`, a list
     * of the found attributes. And `match`, an string with all the text from the
     * start of the attributes until before the `>`.
     */
    var getAttributes = function(template) {
    
      var attributes = [];
      var match = "";
    
      while(true) {
    
        var attrName = template.match(attrNameRE);
    
        // No more attributes
        if(attrName === null) {
          break;
        }
    
        template = template.substr(attrName[0].length);
        match += attrName[0];
    
        var attrValue = "";
    
        // Attr value
        if(attrName[2] === "=") {
          attrValue = template.match(attrValueRE);
    
          template = template.substr(attrValue[0].length);
          match += attrValue[0];
    
          attrValue = attrValue[2];
        }
    
        attrName = attrName[1].split(":");
        attributes.push({
          name: attrName[0],
          value: attrValue,
          argument: attrName[1],
          data: {}
        });
      }
    
      return {
        match: match,
        attributes: attributes
      };
    }
    
    /**
     * Gets text.
     *
     * @param {String} template HTML string to get text from.
     *
     * @return {String} Text, not tags or HTML elements, until next tag.
     */
    var getText = function(template) {
    
      var endText = template.search(tagOrCommentStartRE);
    
      var text = "";
      if(endText === -1) {
        return template;
      }
    
      return template.substring(0, endText);
    }
    
    var lex = function(template) {
    
      var tokens = [];
      var current = 0;
    
      while(template.length > 0) {
    
        // Text
        if(template[current] !== "<") {
    
          var text = getText(template);
    
          template = template.substr(text.length);
    
          // Escape text
          if(text.replace(/\s/g, "").length > 0) {
            tokens.push({
              type: "Text",
              value: text.replace(escapeRE, function(match) {
                return escapeMap[match];
              })
            });
          }
    
          continue;
        }
    
        // Comment
        if(isComment(template)) {
          var comment = getComment(template);
          template = template.substr(comment.length);
          continue;
        }
    
        // Tag
        var tagType = '';
        var attributes = [];
    
        var closeStart = false;
        var closeEnd = false;
    
        // Tag start
        var tagStart = template.match(tagStartRE);
        closeStart = tagStart[1] === "/";
    
        template = template.substr(tagStart[0].length);
    
        // Tag name
        var tagName = template.match(tagNameRE);
        tagType = tagName[1];
    
        template = template.substr(tagName[0].length);
    
        // Attributes
        var attrObj = getAttributes(template);
        attributes = attrObj.attributes;
    
        template = template.substr(attrObj.match.length);
    
        // Tag end
        var tagEnd = template.match(tagEndRE);
        closeEnd = tagEnd[1] === "/";
    
        template = template.substr(tagEnd[0].length);
    
        // Push token
        tokens.push({
          type: "Tag",
          value: tagType,
          attributes: attributes,
          closeStart: closeStart,
          closeEnd: closeEnd
        });
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
          elements[lastIndex].children.push({
            type: "#text",
            data: {
              flags: 0
            },
            value: token.value
          });
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
            var lastChildren = elements[lastIndex].children;
            var index = lastChildren.length;
    
            var node = {
              type: type,
              index: index,
              props: token.attributes,
              data: {
                flags: 0
              },
              children: []
            };
    
            lastChildren[index] = node;
    
            // Add to stack if element is a non void element
            if(token.closeEnd === false && VOID_ELEMENTS.indexOf(type) === -1) {
              elements.push(node);
              lastIndex++;
            }
          }
        }
      }
    
      if("development" !== "production" && root.children[0].type === "#text") {
        error("The root element cannot be text");
      }
      return root.children[0];
    }
    
    var generateStaticNode = function(nodeOutput, staticNodes) {
      var staticNodesLength = staticNodes.length;
      staticNodes[staticNodesLength] = nodeOutput;
      return ("staticNodes[" + staticNodesLength + "]");
    }
    
    var generateData = function(data) {
      var dataOutput = '{';
      var separator = '';
    
      // Events
      var events = data.events;
      var eventHandlerSeparator = '';
      if(events !== undefined) {
        dataOutput += "events: {";
    
        for(var eventType in events) {
          dataOutput += separator + "\"" + eventType + "\": [";
    
          var handlers = events[eventType];
          for(var i = 0; i < handlers.length; i++) {
            dataOutput += eventHandlerSeparator + handlers[i];
            eventHandlerSeparator = ", ";
          }
    
          separator = ", ";
          eventHandlerSeparator = '';
          dataOutput += ']';
        }
    
        dataOutput += '}';
        delete data.events;
      }
    
      // Flags
      if(data.flags === 0) {
        delete data.flags;
      }
    
      for(var key in data) {
        dataOutput += "" + separator + key + ": " + (data[key]);
        separator = ", ";
      }
    
      return dataOutput + '}';
    }
    
    var generateProps = function(type, props) {
      var propOutput = type + ": {";
      var separator = '';
    
      for(var i = 0; i < props.length; i++) {
        var prop = props[i];
        var propValue = prop.value;
    
        if(propValue.length === 0) {
          propValue = "\"\"";
        }
    
        propOutput += separator + "\"" + (prop.name) + "\": " + propValue;
        separator = ", ";
      }
    
      return propOutput + '}';
    }
    
    var generateNodeState = function(node, parentNode, state) {
      var type = node.type;
      if(type === "#text") {
        // Text
        var compiledText = compileTemplate(node.value, state);
        node.value = compiledText.output;
        return compiledText.dynamic;
      } else if(type === "m-insert") {
        // Insert
        parentNode.deep = true;
        return true;
      } else {
        var locals = state.locals;
        var dynamic = false;
        var data = node.data;
    
        // SVG flag
        if(SVG_ELEMENTS.indexOf(type) !== -1) {
          data.flags = data.flags | FLAG_SVG;
        }
    
        // Props
        var props = node.props;
        var propsLength = props.length;
        var propStateAttrs = [];
        var propStateDirectives = [];
        var propStateSpecialDirectivesAfter = [];
        node.props = {
          attrs: propStateAttrs,
          dom: [],
          directives: propStateDirectives,
          specialDirectivesAfter: propStateSpecialDirectivesAfter
        };
    
        // Before/After special directives
        for(var i = 0; i < propsLength; i++) {
          var prop = props[i];
          var specialDirective = specialDirectives[prop.name];
    
          if(specialDirective !== undefined) {
            var specialDirectiveAfter = specialDirective.after;
            if(specialDirectiveAfter !== undefined) {
              propStateSpecialDirectivesAfter.push({
                prop: prop,
                after: specialDirectiveAfter
              });
            }
    
            var specialDirectiveBefore = specialDirective.before;
            if(specialDirectiveBefore !== undefined) {
              if(specialDirectiveBefore(prop, node, parentNode, state) === true) {
                dynamic = true;
              }
            }
          }
        }
    
        // Attributes
        for(var i$1 = 0; i$1 < propsLength; i$1++) {
          var prop$1 = props[i$1];
          var propName = prop$1.name;
          var specialDirective$1 = specialDirectives[propName];
    
          if(specialDirective$1 !== undefined) {
            // During special directive
            var specialDirectiveDuring = specialDirective$1.during;
            if(specialDirectiveDuring !== undefined) {
              if(specialDirectiveDuring(prop$1, node, parentNode, state) === true) {
                dynamic = true;
              }
    
              propStateAttrs.push(prop$1);
            }
          } else if(propName[0] === 'm' && propName[1] === '-') {
            // Directive
            if(compileTemplateExpression(prop$1.value, state) === true) {
              dynamic = true;
            }
    
            propStateDirectives.push(prop$1);
          } else {
            // Attribute
            var compiledProp = compileTemplate(prop$1.value, state);
    
            if(compiledProp.dynamic === true) {
              dynamic = true;
            }
    
            prop$1.value = compiledProp.output;
            propStateAttrs.push(prop$1);
          }
        }
    
        // Children
        var children = node.children;
        var childStates = [];
    
        for(var i$2 = 0; i$2 < children.length; i$2++) {
          var childState = generateNodeState(children[i$2], node, state);
    
          if(childState === true) {
            dynamic = true;
          }
    
          childStates.push(childState);
        }
    
        for(var i$3 = 0; i$3 < children.length; i$3++) {
          if(dynamic === true && childStates[i$3] === false) {
            var childData = children[i$3].data;
            childData.flags = childData.flags | FLAG_STATIC;
          }
        }
    
        // Restore locals
        state.locals = locals;
    
        return dynamic;
      }
    }
    
    var generateNode = function(node, parentNode, state) {
      var type = node.type;
      var data = node.data;
      var callOutput;
    
      if(type === "#text") {
        // Text
        callOutput = "m(\"#text\", " + (generateData(data)) + ", " + (node.value) + ")";
      } else if(type === "m-insert") {
        callOutput = "instance.insert";
      } else {
        callOutput = "m(\"" + type + "\", {";
    
        // Props
        var propState = node.props;
        var propSeparator = '';
    
        // Attributes
        var propStateAttrs = propState.attrs;
        if(propStateAttrs.length !== 0) {
          callOutput += generateProps("attrs", propStateAttrs);
          propSeparator = ", ";
        }
    
        // Directives
        var propStateDirectives = propState.directives;
        if(propStateDirectives.length !== 0) {
          callOutput += generateProps(propSeparator + "directives", propStateDirectives);
          propSeparator = ", ";
        }
    
        // DOM Props
        var propStateDom = propState.dom;
        if(propStateDom.length !== 0) {
          callOutput += generateProps(propSeparator + "dom", propStateDom);
        }
    
        // Data
        callOutput += "}, " + generateData(data) + ", ";
    
        // Children
        var childrenOutput = '';
        var childrenSeparator = '';
        var children = node.children;
        for(var i = 0; i < children.length; i++) {
          childrenOutput += childrenSeparator + generateNode(children[i], node, state);
          childrenSeparator = ", ";
        }
    
        // Close children and call
        if(node.deep === true) {
          callOutput += "m.flatten([" + childrenOutput + "]))";
        } else {
          callOutput += "[" + childrenOutput + "])";
        }
    
        // Process special directives
        var propStateSpecialDirectivesAfter = propState.specialDirectivesAfter;
        for(var i$1 = 0; i$1 < propStateSpecialDirectivesAfter.length; i$1++) {
          var propStateSpecialDirectiveAfter = propStateSpecialDirectivesAfter[i$1];
          callOutput = propStateSpecialDirectiveAfter.after(propStateSpecialDirectiveAfter.prop, callOutput, node, parentNode, state);
        }
      }
    
      // Output
      if((data.flags & FLAG_STATIC) === FLAG_STATIC) {
        return generateStaticNode(callOutput, state.staticNodes);
      } else {
        return callOutput;
      }
    }
    
    var generate = function(tree) {
      var state = {
        staticNodes: [],
        dependencies: {
          props: [],
          methods: []
        },
        exclude: globals,
        locals: []
      };
    
      if(generateNodeState(tree, undefined, state) === false) {
        var treeData = tree.data;
        treeData.flags = treeData.flags | FLAG_STATIC;
      }
    
      var treeOutput = generateNode(tree, undefined, state);
    
      var dependencies = state.dependencies;
      var props = dependencies.props;
      var methods = dependencies.methods;
      var dependenciesOutput = '';
    
      var staticNodes = state.staticNodes;
      var staticNodesOutput = '';
    
      var i = 0;
      var separator = '';
    
      // Generate data prop dependencies
      for(; i < props.length; i++) {
        var propName = props[i];
        dependenciesOutput += "var " + propName + " = instance.get(\"" + propName + "\");";
      }
    
      // Generate method dependencies
      for(i = 0; i < methods.length; i++) {
        var methodName = methods[i];
        dependenciesOutput += "var " + methodName + " = instance.methods[\"" + methodName + "\"];";
      }
    
      // Generate static nodes
      for(i = 0; i < staticNodes.length; i++) {
        staticNodesOutput += separator + staticNodes[i];
        separator = ", ";
      }
    
      // Generate render function
      try {
        return new Function('m', ("var instance = this;var staticNodes = instance.compiledRender.staticNodes;" + dependenciesOutput + "if(staticNodes === undefined) {staticNodes = instance.compiledRender.staticNodes = [" + staticNodesOutput + "];}return " + treeOutput + ";"));
      } catch(e) {
        error("Could not create render function");
        return noop;
      }
    }
    
    var compile = function(template) {
      return generate(parse(lex(template)));
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
    
    Moon.prototype.destroy = function() {
      // Remove event listeners
      this.off();
    
      // Remove reference to element
      this.root = undefined;
    
      // Queue
      this.queued = true;
    
      // Call destroyed hook
      callHook(this, "destroyed");
    }
    
    // Event Emitter, adapted from https://github.com/kbrsh/voke
    
    Moon.prototype.on = function(eventType, handler) {
      var events = this.events;
      var handlers = events[eventType];
    
      if(handlers === undefined) {
        // Create handler
        events[eventType] = [handler];
      } else {
        // Add handler
        handlers.push(handler);
      }
    }
    
    Moon.prototype.off = function(eventType, handler) {
      if(eventType === undefined) {
        // No event name provided, remove all events
        this.events = {};
      } else if(handler === undefined) {
        // No handler provided, remove all handlers for the event name
        this.events[eventType] = [];
      } else {
        // Get handlers from event name
        var handlers = this.events[eventType];
    
        // Get index of the handler to remove
        var index = handlers.indexOf(handler);
    
        // Remove the handler
        handlers.splice(index, 1);
      }
    }
    
    Moon.prototype.emit = function(eventType, data) {
      // Events
      var events = this.events;
    
      // Get handlers and global handlers
      var handlers = events[eventType];
      var globalHandlers = events['*'];
    
      // Counter
      var i;
    
      // Call all handlers for the event name
      if(handlers !== undefined) {
        for(i = 0; i < handlers.length; i++) {
          handlers[i](data);
        }
      }
    
      if(globalHandlers !== undefined) {
        // Call all of the global handlers if present
        for(i = 0; i < globalHandlers.length; i++) {
          globalHandlers[i](eventType, data);
        }
      }
    }
    
    Moon.prototype.mount = function(rootOption) {
      // Get root from the DOM
      var root = this.root = typeof rootOption === "string" ? document.querySelector(rootOption) : rootOption;
      if("development" !== "production" && root === null) {
        error("Element " + this.options.root + " not found");
      }
    
      // Setup template as provided `template` or outerHTML of the node
      defineProperty(this, "template", this.options.template, root.outerHTML);
    
      // Setup render Function
      if(this.compiledRender === noop) {
        this.compiledRender = Moon.compile(this.template);
      }
    
      // Remove queued state
      this.queued = false;
    
      // Hydrate
      var dom = this.render();
      if(root.nodeName.toLowerCase() === dom.type) {
        hydrate(root, dom);
      } else {
        var newRoot = createNode(dom);
        replaceNode(newRoot, root, root.parentNode);
        this.root = newRoot;
      }
    
      this.dom = dom;
    
      // Call mounted hook
      callHook(this, "mounted");
    }
    
    Moon.prototype.render = function() {
      return this.compiledRender(m);
    }
    
    Moon.prototype.build = function() {
      var dom = this.render();
      var old = this.dom;
    
      if(dom !== old) {
        patch(dom, old);
      }
    }
    
    Moon.prototype.init = function() {
      log("======= Moon =======");
      callHook(this, "init");
    
      var root = this.options.root;
      if(root !== undefined) {
        this.mount(root);
      }
    }
    
    
    /* ======= Global API ======= */
    Moon.config = {
      silent: ("development" === "production") || (typeof console === "undefined")
    }
    
    Moon.version = "0.11.0";
    
    Moon.util = {
      noop: noop,
      log: log,
      error: error,
      m: m
    }
    
    Moon.use = function(plugin, options) {
      plugin.init(Moon, options);
    }
    
    Moon.compile = function(template) {
      return compile(template);
    }
    
    Moon.nextTick = function(task) {
      setTimeout(task, 0);
    }
    
    Moon.directive = function(name, action) {
      directives["m-" + name] = action;
    }
    
    Moon.extend = function(name, options) {
      options.name = name;
    
      if(options.data !== undefined && typeof options.data !== "function") {
        error("In components, data must be a function returning an object");
      }
    
      function MoonComponent(componentOptions) {
        this.componentOptions = componentOptions;
        Moon.apply(this, [options]);
      }
    
      MoonComponent.prototype = Object.create(Moon.prototype);
      MoonComponent.prototype.constructor = MoonComponent;
    
      MoonComponent.prototype.init = function() {
        var componentOptions = this.componentOptions;
        var props = componentOptions.props;
        var data = this.data;
    
        for(var prop in props) {
          data[prop] = props[prop];
        }
    
        this.events = componentOptions.events;
        this.insert = componentOptions.insert;
    
        callHook(this, "init");
    
        var root = componentOptions.root;
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
    
    var addEventToNode = function(eventType, eventHandler, node) {
      var data = node.data;
      var events = data.events;
    
      if(events === undefined) {
        events = data.events = {};
        events[eventType] = [eventHandler];
      } else {
        var eventHandlers = events[eventType];
        if(eventHandlers === undefined) {
          events[eventType] = [eventHandler];
        } else {
          eventHandlers.push(eventHandler);
        }
      }
    }
    
    var addDomPropertyToNode = function(domPropName, domPropValue, node) {
      node.props.dom.push({
        name: domPropName,
        value: domPropValue
      });
    }
    
    specialDirectives["m-if"] = {
      before: function(prop, node, parentNode, state) {
        var children = parentNode.children;
        var nextIndex = node.index + 1;
        var nextChild = children[nextIndex];
        compileTemplateExpression(prop.value, state);
    
        if(nextChild !== undefined) {
          var nextChildProps = nextChild.props;
          for(var i = 0; i < nextChildProps.length; i++) {
            var nextChildProp = nextChildProps[i];
            if(nextChildProp.name === "m-else") {
              nextChildProps.splice(i, 1);
    
              if(generateNodeState(nextChild, parentNode, state) === false) {
                var nextChildChildren = nextChild.children;
                for(var j = 0; j < nextChildChildren.length; j++) {
                  var nextChildChildData = nextChildChildren[j].data;
                  nextChildChildData.flags = nextChildChildData.flags | FLAG_STATIC;
                }
              }
    
              prop.data.elseOutput = generateNode(nextChild, parentNode, state);
              children.splice(nextIndex, 1);
              break;
            }
          }
        }
    
        return true;
      },
      after: function(prop, output, node, parentNode, state) {
        var elseOutput = prop.data.elseOutput;
    
        if(elseOutput === undefined) {
          elseOutput = generateStaticNode(("m(\"#text\", {flags: " + FLAG_STATIC + "}, '')"), state.staticNodes);
        }
    
        return ((prop.value) + " ? " + output + " : " + elseOutput);
      }
    };
    
    specialDirectives["m-for"] = {
      before: function(prop, node, parentNode, state) {
        // Flatten children
        parentNode.deep = true;
    
        // Parts
        var parts = prop.value.split(" in ");
    
        // Aliases
        var aliases = trimWhitespace(parts[0]);
    
        // Save information
        var iteratable = parts[1];
        var propData = prop.data;
        propData.forIteratable = iteratable;
        propData.forAliases = aliases;
        state.locals = state.locals.concat(aliases.split(','));
    
        // Compile iteratable
        compileTemplateExpression(iteratable, state);
    
        return true;
      },
      after: function(prop, output, node, parentNode, state) {
        // Get information about parameters
        var propData = prop.data;
    
        // Use the renderLoop runtime helper
        return ("m.renderLoop(" + (propData.forIteratable) + ", function(" + (propData.forAliases) + ") {return " + output + ";})");
      }
    };
    
    specialDirectives["m-on"] = {
      before: function(prop, node, parentNode, state) {
        var exclude = state.exclude;
    
        // Get method call
        var methodCall = prop.value;
        if(methodCall.indexOf('(') === -1) {
          methodCall += "()";
        }
    
        // Add event handler
        addEventToNode(prop.argument, ("function(event) {" + methodCall + ";}"), node);
    
        // Compile method call
        exclude.push("event");
        var dynamic = compileTemplateExpression(methodCall, state);
        exclude.pop();
        return dynamic;
      }
    };
    
    specialDirectives["m-bind"] = {
      before: function(prop, node, parentNode, state) {
        var value = prop.value;
    
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
        var eventHandler = '';
    
        if(dynamicIndex === -1) {
          eventHandler = "function(event) {instance.set(\"" + instanceKey + "\", " + instanceValue + ");}";
        } else {
          eventHandler = "function(event) {var boundValue = instance.get(\"" + base + "\");boundValue" + properties + " = " + instanceValue + ";instance.set(\"" + base + "\", boundValue);}";
        }
    
        addEventToNode(eventType, eventHandler, node);
        addDomPropertyToNode(domKey, domValue, node);
    
        return compileTemplateExpression(value, state);
      }
    };
    
    specialDirectives["m-dom"] = {
      before: function(prop, node, parentNode, state) {
        var propValue = prop.value;
        addDomPropertyToNode(prop.argument, propValue, node);
        return compileTemplateExpression(propValue, state);
      }
    };
    
    specialDirectives["m-literal"] = {
      during: function(prop, node, parentNode, state) {
        var argument = prop.argument;
        prop.name = argument;
    
        if(argument === "class") {
          prop.value = "m.renderClass(" + (prop.value) + ")";
        }
    
        return compileTemplateExpression(prop.value, state);
      }
    };
    
    specialDirectives["m-mask"] = {
    
    };
    
    
    return Moon;
}));
