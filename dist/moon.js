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
        node = data.SVG === 1 ? document.createElementNS("http://www.w3.org/2000/svg", type) : document.createElement(type);
    
        // Append all children
        for(var i = 0; i < children.length; i++) {
          appendChild(children[i], node);
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
    
    var appendChild = function(vnode, parent) {
      var component = vnode.data.component;
    
      if(component === undefined) {
        parent.appendChild(createNode(vnode));
      } else {
        var root = document.createElement(vnode.type);
        parent.appendChild(root);
        createComponent(root, vnode, component);
      }
    }
    
    var m = function(type, props, data, children) {
      if(type === "#text") {
        // Text virtual node
        return {
          type: type,
          value: props,
          data: {}
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
    
    m.emptyVNode = m("#text", '');
    
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
    
    var hydrate = function(node, vnode) {
      var data = vnode.data;
    
      // Add reference to node
      data.node = node;
    
      // Patch props
      var props = vnode.props;
      var nodeAttrs = node.attributes;
      var oldAttrs = {};
      for(var i = 0; i < nodeAttrs.length; i++) {
        var nodeAttr = nodeAttrs[i];
        oldAttrs[nodeAttr.name] = nodeAttr.value;
      }
      patchProps(node, oldAttrs, vnode, props);
    
      // Add events
      var events = data.events;
      if(events !== undefined) {
        addEvents(node, events);
      }
    
      // Hydrate children
      var domProps = props.dom;
      if((domProps === undefined) || (domProps.innerHTML === undefined && domProps.textContent === undefined)) {
        var children = vnode.children;
        var childrenLength = children.length;
    
        var i$1 = 0;
    
        var childVNode = i$1 === childrenLength ? undefined : children[i$1];
        var childNode = node.firstChild;
    
        while(childVNode !== undefined || childNode !== null) {
          if(childNode === null) {
            // Node doesn't exist, create and append a node
            appendChild(childVNode, node);
          } else {
            var nextSibling = childNode.nextSibling;
    
            if(childVNode === undefined) {
              // No VNode, remove the node
              node.removeChild(childNode);
            } else {
              var component = childVNode.data.component;
              if(component !== undefined) {
                // Create a component
                createComponent(childNode, childVNode, component);
              } else {
                var type = childVNode.type;
                if(childNode.nodeName.toLowerCase() !== type) {
                  // Different types, replace nodes
                  node.replaceChild(createNode(childVNode), childNode);
                } else if(type === "#text") {
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
    
          childVNode = ++i$1 < childrenLength ? children[i$1] : undefined;
        }
      }
    }
    
    var patch = function(newVNode, oldVNode) {
      var oldData = oldVNode.data;
      var node = oldData.node;
    
      // Patch props
      var newProps = newVNode.props;
      patchProps(node, oldVNode.props.attrs, newVNode, newProps);
      oldVNode.props = newProps;
    
      // Patch events
      var newEvents = newVNode.data.events;
      if(newEvents !== undefined) {
        patchEvents(newEvents, oldData.events);
      }
    
      // Patch children
      var newChildren = newVNode.children;
      var oldChildren = oldVNode.children;
    
      var newLength = newChildren.length;
      var oldLength = oldChildren.length;
      var totalLength = newLength > oldLength ? newLength : oldLength;
    
      for(var i = 0; i < totalLength; i++) {
        if(i >= newLength) {
          // Past length of new children, remove child
          var oldChild = oldChildren.pop();
          var oldChildData = oldChild.data;
          var oldComponentInstance = oldChildData.component;
    
          if(oldComponentInstance !== undefined) {
            oldComponentInstance.destroy();
          }
    
          node.removeChild(oldChildData.node);
        } else if(i >= oldLength) {
          // Past length of old children, append child
          appendChild((oldChildren[i] = newChildren[i]), node);
        } else {
          var newChild = newChildren[i];
          var oldChild$1 = oldChildren[i];
    
          var newType = newChild.type;
          if(newType !== oldChild$1.type) {
            // Types are different, replace child
            var oldChildData$1 = oldChild$1.data;
            var oldComponentInstance$1 = oldChildData$1.component;
    
            if(oldComponentInstance$1 !== undefined) {
              oldComponentInstance$1.destroy();
            }
    
            var newComponent = newChild.data.component;
            if(newComponent === undefined) {
              node.replaceChild(createNode(newChild), oldChildData$1.node);
            } else {
              createComponent(oldChildData$1.node, newChild, newComponent);
            }
    
            oldChildren[i] = newChild;
          } else if(newChild !== oldChild$1) {
            var oldChildData$2 = oldChild$1.data;
            var componentInstance = oldChildData$2.component;
            if(componentInstance !== undefined) {
              // Component found
              var componentChanged = false;
    
              var componentProps = componentInstance.options.props;
              if(componentProps !== undefined) {
                // Update component props
                var newChildAttrs = newChild.props.attrs;
                var componentObserver = componentInstance.observer;
                var componentData = componentInstance.data;
    
                for(var j = 0; j < componentProps.length; j++) {
                  var componentPropName = componentProps[j];
                  componentData[componentPropName] = newChildAttrs[componentPropName];
                  componentObserver.notify(componentPropName);
                }
    
                componentChanged = true;
              }
    
              // Patch component events
              var newChildEvents = newChild.data.events;
              if(newChildEvents !== undefined) {
                patchEvents(newChildEvents, oldChildData$2.events);
              }
    
              // Add insert
              var newChildChildren = newChild.children;
              if(newChildChildren.length !== 0) {
                componentInstance.insert = newChildChildren;
                componentChanged = true;
              }
    
              // Build component if changed
              if(componentChanged === true) {
                componentInstance.build();
                callHook(componentInstance, "updated");
              }
            } else if(newType === "#text") {
              // Text node, update value
              var newValue = newChild.value;
              oldChildData$2.node.textContent = newValue;
              oldChild$1.value = newValue;
            } else {
              // Patch children
              patch(newChild, oldChild$1);
            }
          }
        }
      }
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
    var globals = ["instance", "staticNodes", "event", "true", "false", "undefined", "null", "NaN", "typeof", "in"];
    
    // Void and SVG Elements
    var VOID_ELEMENTS = ["area", "base", "br", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
    var SVG_ELEMENTS = ["animate", "circle", "clippath", "cursor", "defs", "desc", "ellipse", "filter", "font-face", "foreignObject", "g", "glyph", "image", "line", "marker", "mask", "missing-glyph", "path", "pattern", "polygon", "polyline", "rect", "svg", "switch", "symbol", "text", "textpath", "tspan", "use", "view"];
    
    var compileTemplateExpression = function(expression, state) {
      var dependencies = state.dependencies;
      var exclude = state.exclude;
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
          } else {
            if(props.indexOf(name) === -1) {
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
                  argument: undefined,
                  data: {}
                }
    
                var splitAttrName = attrName.split(':');
                if(splitAttrName.length === 2) {
                  attrToken.name = splitAttrName[0];
                  attrToken.argument = splitAttrName[1];
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
          elements[lastIndex].children.push({
            type: "#text",
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
              props: {
                attrs: token.attributes
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
    
    var generateNode = function(node, parentNode, state) {
      var type = node.type;
      if(type === "#text") {
        // Text node
        var compiled = compileTemplate(node.value, state);
        return {
          output: ("m(\"#text\", " + (compiled.output) + ")"),
          dynamic: compiled.dynamic
        };
      } else if(type === "m-insert") {
        parentNode.deep = true;
        return {
          output: "instance.insert",
          dynamic: true
        };
      } else {
        var callOutput = "m(\"" + type + "\", {";
        var dynamic = false;
        var separator = '';
        var data = node.data = {};
    
        // Mark SVG elements
        if(SVG_ELEMENTS.indexOf(type) !== -1) {
          data.SVG = 1;
        }
    
        // Generate props
        var props = node.props;
        var attrs = props.attrs;
        var generateAttrs = [];
        var generateDirectives = [];
        var specialDirective;
        var specialDirectivesAfter = [];
        var attrName;
        var attr;
        var i;
    
        // Invoke special directives to generate before
        var before;
        for(attrName in attrs) {
          attr = attrs[attrName];
          if((specialDirective = specialDirectives[attr.name]) !== undefined && (before = specialDirective.before) !== undefined) {
            if(before(attr, node, parentNode, state) === true) {
              dynamic = true;
            }
          }
        }
    
        // Process other attributes
        for(attrName in attrs) {
          attr = attrs[attrName];
          specialDirective = specialDirectives[attr.name];
          if(specialDirective !== undefined) {
            var after = specialDirective.after;
            if(after !== undefined) {
              // After generation
              specialDirectivesAfter.push({
                attr: attr,
                after: after
              });
            }
    
            var during = specialDirective.during;
            if(during !== undefined) {
              // During generation
              var duringProp = during(attr, node, parentNode, state);
              if(duringProp !== undefined) {
                if(duringProp.dynamic === true) {
                  dynamic = true;
                }
    
                generateAttrs.push(duringProp.output);
              }
            }
          } else if(attrName[0] === 'm' && attrName[1] === '-') {
            // Directive
            generateDirectives.push(attr);
          } else {
            // Attribute
            generateAttrs.push(attr);
          }
        }
    
        // Generate attributes
        var generateAttrsLength = generateAttrs.length;
        var existingPropType = false;
        if(generateAttrsLength !== 0) {
          // Add attributes object
          callOutput += "attrs: {";
    
          for(i = 0; i < generateAttrsLength; i++) {
            // Generate attribute name and value
            attr = generateAttrs[i];
    
            if(typeof attr === "string") {
              // During generation literal property
              callOutput += separator + attr;
            } else {
              // Normal property
              var compiledAttr = compileTemplate(attr.value, state);
              if(compiledAttr.dynamic === true) {
                dynamic = true;
              }
              callOutput += separator + "\"" + (attr.name) + "\": " + (compiledAttr.output);
            }
    
            separator = ", ";
          }
    
          // Close attributes object
          separator = '';
          callOutput += '}';
          existingPropType = true;
        }
    
        // Generate directives
        var generateDirectivesLength = generateDirectives.length;
        if(generateDirectivesLength !== 0) {
          // Add directives object to props
          if(existingPropType === true) {
            callOutput += ", directives: {";
          } else {
            callOutput += "directives: {";
            existingPropType = true;
          }
    
          for(i = 0; i < generateDirectivesLength; i++) {
            // Generate directive name and value
            attr = generateDirectives[i];
    
            var directiveValue = attr.value;
            if(directiveValue.length === 0) {
              directiveValue = "\"\"";
            } else if(compileTemplateExpression(directiveValue, state) === true) {
              dynamic = true;
            }
    
            callOutput += separator + "\"" + (attr.name) + "\": " + directiveValue;
            separator = ", ";
          }
    
          // Close directives object
          separator = '';
          callOutput += '}';
        }
    
        var domProps = props.dom;
        if(domProps !== undefined) {
          // Add dom object to props
          callOutput += existingPropType === true ? ", dom: {" : "dom: {";
    
          for(var domPropName in domProps) {
            // Generate dom property name and value
            var domPropValue = domProps[domPropName];
            if(compileTemplateExpression(domPropValue, state) === true) {
              dynamic = true;
            }
            callOutput += separator + "\"" + domPropName + "\": " + domPropValue;
            separator = ", ";
          }
    
          // Close dom object
          separator = '';
          callOutput += '}';
        }
    
        // Close props object, start data object
        callOutput += "}, {";
    
        var events = data["events"];
        var eventHandlerSeparator = '';
        if(events !== undefined) {
          // Add events object to data
          callOutput += "events: {";
    
          for(var eventType in events) {
            // Add event type and open handlers array
            callOutput += separator + "\"" + eventType + "\": [";
    
            var handlers = events[eventType];
            for(i = 0; i < handlers.length; i++) {
              // Add handler
              callOutput += eventHandlerSeparator + handlers[i];
              eventHandlerSeparator = ", ";
            }
    
            // Close event type
            separator = ", ";
            eventHandlerSeparator = '';
            callOutput += ']';
          }
    
          // Close events object
          callOutput += '}';
          delete data["events"];
        }
    
        for(var key in data) {
          // Generate data key and value
          callOutput += "" + separator + key + ": " + (data[key]);
          separator = ", ";
        }
    
        // Close data
        callOutput += "}, ";
    
        // Generate children
        var children = node.children;
        var generatedChildren = [];
        var childrenOutput = '';
        separator = '';
        for(i = 0; i < children.length; i++) {
          // Generate child node
          var generatedChild = generateNode(children[i], node, state);
    
          if(generatedChild.dynamic === true) {
            dynamic = true;
          }
    
          generatedChildren.push(generatedChild);
        }
    
        var staticNodes = state.staticNodes;
        for(i = 0; i < generatedChildren.length; i++) {
          var generatedChild$1 = generatedChildren[i];
          if(dynamic === true && generatedChild$1.dynamic === false) {
            childrenOutput += separator + generateStaticNode(generatedChild$1.output, staticNodes);
          } else {
            childrenOutput += separator + generatedChild$1.output;
          }
    
          separator = ", ";
        }
    
        // Close children and call
        if(node.deep === true) {
          callOutput += "m.flatten([" + childrenOutput + "]))";
        } else {
          callOutput += "[" + childrenOutput + "])";
        }
    
        // Process special directives
        for(i = 0; i < specialDirectivesAfter.length; i++) {
          var specialDirectiveAfter = specialDirectivesAfter[i];
          callOutput = specialDirectiveAfter.after(specialDirectiveAfter.attr, callOutput, node, parentNode, state);
        }
    
        return {
          output: callOutput,
          dynamic: dynamic
        };
      }
    }
    
    var generate = function(tree) {
      var state = {
        staticNodes: [],
        exclude: globals,
        dependencies: {
          props: [],
          methods: []
        }
      };
    
      var treeOutput = generateNode(tree, undefined, state);
    
      var dependencies = state.dependencies;
      var props = dependencies.props;
      var methods = dependencies.methods;
      var dependenciesOutput = '';
    
      var staticNodes = state.staticNodes;
      var staticNodesOutput = '';
    
      var i = 0;
      var separator = '';
    
      if(treeOutput.dynamic === true) {
        treeOutput = treeOutput.output;
      } else {
        staticNodes[0] = treeOutput.output;
        treeOutput = "staticNodes[0]";
      }
    
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
        root.parentNode.replaceChild(newRoot, root);
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
      var dom = node.props.dom;
      if(dom === undefined) {
        node.props.dom = dom = {};
      }
    
      dom[domPropName] = domPropValue;
    }
    
    specialDirectives["m-if"] = {
      before: function(attr, node, parentNode, state) {
        var children = parentNode.children;
        var nextIndex = node.index + 1;
        var nextChild = children[nextIndex];
        var dynamic = compileTemplateExpression(attr.value, state);
        var data = attr.data;
    
        if(nextChild !== undefined) {
          var nextChildAttrs = nextChild.props.attrs;
          if(nextChildAttrs["m-else"] !== undefined) {
            delete nextChildAttrs["m-else"];
            data.elseNode = generateNode(nextChild, parentNode, state);
            children.splice(nextIndex, 1);
          }
        }
    
        if(dynamic === true) {
          var attrs = node.props.attrs;
          var ifAttr = attrs["m-if"];
          delete attrs["m-if"];
          data.ifNode = generateNode(node, parentNode, state);
          node.children = [];
          attrs["m-if"] = ifAttr;
        }
    
        return dynamic;
      },
      after: function(attr, output, node, parentNode, state) {
        var data = attr.data;
        var ifNode = data.ifNode;
        var elseNode = data.elseNode;
        var ifValue = output;
        var elseValue = "m.emptyVNode";
        var staticNodes = state.staticNodes;
    
        if(ifNode !== undefined) {
          if(ifNode.dynamic === true) {
            ifValue = ifNode.output;
          } else {
            ifValue = generateStaticNode(ifNode.output, staticNodes);
          }
        }
    
        if(elseNode !== undefined) {
          if(elseNode.dynamic === true) {
            elseValue = elseNode.output;
          } else {
            elseValue = generateStaticNode(elseNode.output, staticNodes);
          }
        }
    
        return ((attr.value) + " ? " + ifValue + " : " + elseValue);
      }
    };
    
    specialDirectives["m-for"] = {
      before: function(attr, node, parentNode, state) {
        // Flatten children
        parentNode.deep = true;
    
        // Parts
        var parts = attr.value.split(" in ");
    
        // Aliases
        var aliases = parts[0];
    
        // Save information
        var iteratable = parts[1];
        var exclude = state.exclude;
        attr.data.forInfo = [iteratable, aliases, exclude];
        state.exclude = exclude.concat(aliases.split(','));
    
        return compileTemplateExpression(iteratable, state);
      },
      after: function(attr, output, node, parentNode, state) {
        // Get information about parameters
        var forInfo = attr.data.forInfo;
    
        // Restore globals to exclude
        state.exclude = forInfo[2];
    
        // Use the renderLoop runtime helper
        return ("m.renderLoop(" + (forInfo[0]) + ", function(" + (forInfo[1]) + ") {return " + output + ";})");
      }
    };
    
    specialDirectives["m-on"] = {
      before: function(attr, node, parentNode, state) {
        // Get event type
        var eventType = attr.argument;
    
        // Get method call
        var methodCall = attr.value;
        if(methodCall.indexOf('(') === -1) {
          methodCall += "(event)";
        }
    
        // Add event handler
        addEventToNode(eventType, ("function(event) {" + methodCall + ";}"), node);
    
        // Compile method call
        return compileTemplateExpression(methodCall, state);
      }
    };
    
    specialDirectives["m-bind"] = {
      before: function(attr, node, parentNode, state) {
        var value = attr.value;
    
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
    
    specialDirectives["m-literal"] = {
      during: function(attr, node, parentNode, state) {
        var modifiers = attr.argument.split('.');
        var attrName = modifiers.shift();
        var attrValue = attr.value;
        var output = undefined;
    
        if(modifiers[0] === "dom") {
          // Literal DOM property
          addDomPropertyToNode(attrName, attrValue, node);
          return output;
        } else {
          if(attrName === "class") {
            // Render class at runtime
            output = "\"class\": m.renderClass(" + attrValue + ")";
          } else {
            // Literal attribute
            output = "\"" + attrName + "\": " + attrValue;
          }
    
          return {
            output: output,
            dynamic: compileTemplateExpression(attrValue, state)
          }
        }
      }
    };
    
    specialDirectives["m-mask"] = {
    
    };
    
    
    return Moon;
}));
