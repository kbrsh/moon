/*
* Moon 0.1.3
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
    var components = {};
    var id = 0;
    
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
      console.error("[Moon] ERR: " + msg);
    };
    
    /**
     * Compiles a Template
     * @param {String} template
     * @param {Boolean} isString
     * @return {String} compiled template
     */
    var compileTemplate = function (template, isString) {
      var TEMPLATE_RE = /{{([A-Za-z0-9_.()\[\]]+)}}/gi;
      var compiled = "";
      template.replace(TEMPLATE_RE, function (match, key) {
        if (isString) {
          compiled = template.replace(match, "\" + this.get(\"" + key + "\") + \"");
        } else {
          compiled = template.replace(match, "this.get(\"" + key + "\")");
        }
      });
      return compiled;
    };
    
    /**
     * Creates a Virtual DOM Node
     * @param {String} type
     * @param {String} val
     * @param {Object} props
     * @param {Array} children
     * @param {Object} meta
     * @return {Object} Virtual DOM Node
     */
    var createElement = function (type, val, props, children, meta) {
      return {
        type: type,
        val: val,
        props: props,
        children: children,
        meta: meta || {
          shouldRender: true
        }
      };
    };
    
    /**
     * Compiles JSX to Virtual DOM
     * @param {String} tag
     * @param {Object} attrs
     * @param {Array} children
     * @return {String} Object usable in Virtual DOM
     */
    var h = function () {
      var args = Array.prototype.slice.call(arguments);
      var tag = args.shift();
      var attrs = args.shift() || {};
      var children = args;
      return createElement(tag, children.join(""), attrs, children, null);
    };
    
    /**
     * Creates DOM Node from VNode
     * @param {Object} vnode
     * @return {Object} DOM Node
     */
    var createNodeFromVNode = function (vnode) {
      var el;
      if (typeof vnode === "string") {
        el = document.createTextNode(vnode);
      } else {
        el = document.createElement(vnode.type);
        var children = vnode.children.map(createNodeFromVNode);
        for (var i = 0; i < children.length; i++) {
          el.appendChild(children[i]);
        }
      }
      return el;
    };
    
    /**
     * Diffs Node and a VNode, and applys Changes
     * @param {Object} node
     * @param {Object} vnode
     * @param {Object} parent
     */
    var diff = function (node, vnode, parent) {
      var nodeName;
      if (node) {
        nodeName = node.nodeName.toLowerCase();
      }
      if (vnode === null) {
        vnode = '';
      }
    
      if (!node) {
        parent.appendChild(createNodeFromVNode(vnode));
      } else if (!vnode) {
        parent.removeChild(node);
      } else if (nodeName !== (vnode.type || "#text")) {
        parent.replaceChild(createNodeFromVNode(vnode), node);
      } else if (nodeName === "#text" && typeof vnode === "string") {
        node.textContent = vnode;
      } else if (vnode.children) {
        for (var i = 0; i < vnode.children.length || i < node.childNodes.length; i++) {
          diff(node.childNodes[i], vnode.children[i], node);
        }
      }
    };
    
    /**
     * Merges two Objects
     * @param {Object} obj
     * @param {Object} obj2
     * @return {Object} Merged Objects
     */
    var merge = function (obj, obj2) {
      for (var key in obj2) {
        if (obj2.hasOwnProperty(key)) obj[key] = obj2[key];
      }
      return obj;
    };
    
    /**
     * Does No Operation
     */
    var noop = function () {};
    
    /* ======= Compiler ======= */
    var lex = function (input, opts) {
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
      var startChar = input.charAt(state.currrent);
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
      var rawAttrs = "";
    
      // Captures attributes
      var ATTRIBUTE_RE = /([^=\s]*)(=?)("[^"]*"|[^\s"]*)/gi;
    
      while (end < len) {
        var char = input.charAt(end);
        if (char === ">" || char === "/") {
          break;
        }
        rawAttrs += char;
        end++;
      }
    
      rawAttrs.replace(ATTRIBUTE_RE, function (match, key, equal, value) {
        var firstChar = value[0];
        var lastChar = value[value.length - 1];
        // Quotes were included in the value
        if (firstChar === "'" && lastChar === "'" || firstChar === "\"" && lastChar === "\"") {
          value = value.slice(1, -1);
        }
    
        // If there is no value provided
        if (!value) {
          value = key;
        }
        // Set attribute value
        if (key && value) {
          attrs[key] = value;
        }
      });
    
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
      if (token.type === "tag" && !previousToken.close && !thirdToken.close) {
        var node = createParseNode(token.value, secondToken.value, []);
        var tagType = token.value;
        // Exit Start Tag
        increment(3);
        var startContentIndex = state.current;
        // Make sure it has content and is closed
        if (token) {
          // Find Closing Tag, and push children recursively
          while (token.type !== "tag" || token.type === "tag" && token.value !== tagType && (!previousToken.close || !thirdToken.close)) {
            if (token.type === "tagStart" && secondToken.value !== tagType && (token.close || fourthToken.close)) {
              // Tag is a voidElement, empty children, and reset stack to start of content
              state.current = startContentIndex;
              node.children = [];
              increment(0);
              break;
            }
            // Push a child to the current node
            var parsedChildState = walk(state);
            if (parsedChildState) {
              node.children.push(parsedChildState);
            }
            increment(0);
          }
        }
    
        return node;
      }
    
      increment();
      return;
    };
    
    var generateEl = function (el) {
      var code = "";
      if (typeof el === "string") {
        code += "\"" + el + "\"";
      } else {
        // Recursively generate code for children
        el.children = el.children.map(generateEl);
        var compiledCode = "h(\"" + el.type + "\", " + JSON.stringify(el.props) + ", " + (el.children.join(",") || null) + ")";
        for (var prop in el.props) {
          if (directives[prop] && directives[prop].beforeGenerate) {
            compiledCode = directives[prop].beforeGenerate(el.props[prop], compiledCode, el);
          }
          delete directives[prop];
        }
        code += compiledCode;
      }
      return code;
    };
    
    var generate = function (ast) {
      var NEWLINE_RE = /\n/g;
      // Get root element
      var root = ast.children[0];
      // Begin Code
      var code = "return " + generateEl(root);
    
      // Compile Templates pass 13 fail 18
      code = compileTemplate(code, true);
    
      // Escape Newlines
      code = code.replace(NEWLINE_RE, "\" + \"\\n\" + \"");
    
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
    
      var self = this;
      var _data = this.$opts.data;
    
      this.$id = id++;
    
      this.$render = this.$opts.render || noop;
      this.$hooks = merge({ created: noop, mounted: noop, updated: noop, destroyed: noop }, this.$opts.hooks);
      this.$methods = this.$opts.methods || {};
      this.$components = merge(this.$opts.components || {}, components);
      this.$directives = merge(this.$opts.directives || {}, directives);
      this.$events = {};
      this.$dom = {};
      this.$destroyed = false;
      this.$queued = false;
    
      /* ======= Listen for Changes ======= */
      Object.defineProperty(this, '$data', {
        get: function () {
          return _data;
        },
        set: function (value) {
          _data = value;
          this.build(this.$dom.children);
        },
        configurable: true
      });
    
      /* ======= Default Directives ======= */
      directives[Moon.config.prefix + "if"] = {
        beforeGenerate: function (value, code, vnode) {
          return "(" + compileTemplate(value) + ") ? " + code + " : ''";
        }
      };
    
      directives[Moon.config.prefix + "show"] = function (el, val, vdom) {
        var evaluated = new Function("return " + val);
        if (!evaluated()) {
          el.style.display = 'none';
        } else {
          el.style.display = 'block';
        }
      };
    
      directives[Moon.config.prefix + "on"] = function (el, val, vdom) {
        var splitVal = val.split(":");
        var eventToCall = splitVal[0];
        var methodToCall = splitVal[1];
        if (self.$events[eventToCall]) {
          self.on(eventToCall, methodToCall);
        } else {
          el.addEventListener(eventToCall, function (e) {
            self.callMethod(methodToCall, [e]);
          });
        }
        delete vdom.props[Moon.config.prefix + "on"];
      };
    
      directives[Moon.config.prefix + "model"] = function (el, val, vdom) {
        el.value = self.get(val);
        el.addEventListener("input", function () {
          self.set(val, el.value);
        });
        delete vdom.props[Moon.config.prefix + "model"];
      };
    
      directives[Moon.config.prefix + "for"] = function (el, val, vdom) {
        var parts = val.split(" in ");
        var alias = parts[0];
        var array = self.get(parts[1]);
      };
    
      directives[Moon.config.prefix + "once"] = function (el, val, vdom) {
        vdom.meta.shouldRender = false;
      };
    
      directives[Moon.config.prefix + "text"] = function (el, val, vdom) {
        el.textContent = val;
      };
    
      directives[Moon.config.prefix + "html"] = function (el, val, vdom) {
        el.innerHTML = val;
      };
    
      directives[Moon.config.prefix + "mask"] = function (el, val, vdom) {};
    
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
      return this.$data[key];
    };
    
    /**
     * Sets Value in Data
     * @param {String} key
     * @param {String} val
     */
    Moon.prototype.set = function (key, val) {
      var self = this;
      this.$data[key] = val;
      if (!this.$queued && !this.$destroyed) {
        this.$queued = true;
        setTimeout(function () {
          self.build();
          self.$hooks.updated();
          self.$queued = false;
        }, 0);
      }
    };
    
    /**
     * Destroys Moon Instance
     */
    Moon.prototype.destroy = function () {
      Object.defineProperty(this, '$data', {
        set: function (value) {
          _data = value;
        }
      });
      this.removeEvents();
      this.$destroyed = true;
      this.$hooks.destroyed();
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
          var globalHandler = this.$events["*"][i];
          globalHandler(meta);
        }
      }
    
      for (var i = 0; i < this.$events[eventName].length; i++) {
        var handler = this.$events[eventName][i];
        handler(meta);
      }
    };
    
    /**
     * Mounts Moon Element
     * @param {Object} el
     */
    Moon.prototype.mount = function (el) {
      this.$el = document.querySelector(el);
    
      if (!this.$el) {
        error("Element " + this.$opts.el + " not found");
      }
    
      this.$template = this.$opts.template || this.$el.outerHTML;
    
      if (this.$render === noop) {
        this.$render = Moon.compile(this.$template);
      }
    
      this.build();
      this.$hooks.mounted();
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
     * @param {Object} node
     * @param {Object} vnode
     */
    Moon.prototype.patch = function (node, vnode, parent) {
      diff(node, vnode, parent);
    };
    
    /**
     * Render and Patches the DOM With Data
     */
    Moon.prototype.build = function () {
      this.$dom = this.render();
      this.patch(this.$el, this.$dom, this.$el.parentNode);
    };
    
    /**
     * Initializes Moon
     */
    Moon.prototype.init = function () {
      log("======= Moon =======");
      this.$hooks.created();
    
      if (this.$opts.el) {
        this.mount(this.$opts.el);
      }
    };
    
    /* ======= Global API ======= */
    
    /**
     * Configuration of Moon
     */
    Moon.config = {
      silent: false,
      prefix: "m-"
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
      function MoonComponent() {
        Moon.call(this, opts);
      }
      MoonComponent.prototype = Object.create(Parent.prototype);
      MoonComponent.prototype.constructor = MoonComponent;
      var component = new MoonComponent();
      components[name] = component;
      return component;
    };
    return Moon;
}));
