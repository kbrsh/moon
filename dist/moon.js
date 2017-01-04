/*
* Moon 0.1.3
* Copyright 2016, Kabir Shah
* https://github.com/KingPixil/moon/
* Free to use under the MIT license.
* https://kingpixil.github.io/license
*/

"use strict";
(function(window) {

    /* ======= Global Variables ======= */
    var config = {
      silent: false
    }
    var directives = {};
    var components = {};

    /* ======= Global Utilities ======= */
    
    /**
    * Converts attributes into key-value pairs
    * @param {Node} node
    * @return {Object} Key-Value pairs of Attributes
    */
    var extractAttrs = function(node) {
      var attrs = {};
      if(!node.attributes) return attrs;
      var rawAttrs = node.attributes;
      for(var i = 0; i < rawAttrs.length; i++) {
        attrs[rawAttrs[i].name] = rawAttrs[i].value
      }
    
      return attrs;
    }
    
    /**
    * Compiles a template with given data
    * @param {String} template
    * @param {Object} data
    * @return {String} Template with data rendered
    */
    var compileTemplate = function(template, data) {
      var code = template,
          re = /{{([A-Za-z0-9_.()\[\]]+)}}/gi;
      code.replace(re, function(match, p) {
        code = code.replace(match, "` + data." + p + " + `");
      });
      var compile = new Function("data", "var out = `" + code + "`; return out");
      var output = compile(data);
      return output;
    }
    
    /**
    * Gets Root Element
    * @param {String} html
    * @return {Node} Root Element
    */
    var getRootElement = function(html) {
      var dummy = document.createElement('div');
      dummy.innerHTML = html;
      return dummy.firstChild;
    }
    
    /**
    * Merges two Objects
    * @param {Object} obj
    * @param {Object} obj2
    * @return {Object} Merged Objects
    */
    function merge(obj, obj2) {
      for (var key in obj2) {
        if (obj2.hasOwnProperty(key)) obj[key] = obj2[key];
      }
      return obj;
    }
    
    /**
    * Creates an object to be used in a Virtual DOM
    * @param {String} type
    * @param {Array} children
    * @param {String} val
    * @param {Object} props
    * @param {Node} node
    * @return {Object} Object usable in Virtual DOM
    */
    var createElement = function(type, children, val, props, node) {
      return {type: type, children: children, val: val, props: props, node: node};
    }
    
    /**
    * Create Elements Recursively For all Children
    * @param {Array} children
    * @return {Array} Array of elements usable in Virtual DOM
    */
    var recursiveChildren = function(children) {
      var recursiveChildrenArr = [];
      for(var i = 0; i < children.length; i++) {
        var child = children[i];
        recursiveChildrenArr.push(createElement(child.nodeName, recursiveChildren(child.childNodes), child.textContent, extractAttrs(child), child));
      }
      return recursiveChildrenArr;
    }
    
    /**
    * Creates Virtual DOM
    * @param {Node} node
    * @return {Object} Virtual DOM
    */
    var createVirtualDOM = function(node) {
      var vdom = createElement(node.nodeName, recursiveChildren(node.childNodes), node.textContent, extractAttrs(node), node);
      return vdom;
    }
    
    /**
     * Does No Operation
     */
    var noop = function() {
    
    }
    

    function Moon(opts) {
        /* ======= Initial Values ======= */
        var _el = opts.el;
        var _data = opts.data;
        var self = this;
        this.$el = document.querySelector(_el);
        this.$hooks = merge({created: noop, mounted: noop, updated: noop, destroyed: noop}, opts.hooks);
        this.$methods = opts.methods || {};
        this.$components = merge(opts.components || {}, components);
        this.$dom = {type: this.$el.nodeName, children: [], node: this.$el};
        this.$destroyed = false;

        /* ======= Listen for Changes ======= */
        Object.defineProperty(this, '$data', {
            get: function() {
                return _data;
            },
            set: function(value) {
                _data = value;
                this.build(this.$dom.children);
            },
            configurable: true
        });

        /* ======= Default Directives ======= */
        directives["m-if"] = function(el, val, vdom) {
          var evaluated = new Function("return " + val);
          if(!evaluated()) {
            el.textContent = "";
          } else {
            el.textContent = compileTemplate(vdom.val, self.$data);
          }
        }
        
        directives["m-show"] = function(el, val, vdom) {
          var evaluated = new Function("return " + val);
          if(!evaluated()) {
            el.style.display = 'none';
          } else {
            el.style.display = 'block';
          }
        }
        
        directives["m-on"] = function(el, val, vdom) {
          var splitVal = val.split(":");
          var eventToCall = splitVal[0];
          var methodToCall = splitVal[1];
          el.addEventListener(eventToCall, function() {
            self.method(methodToCall);
          });
          delete vdom.props["m-on"];
        }
        
        directives["m-model"] = function(el, val, vdom) {
          el.value = self.get(val);
          el.addEventListener("input", function() {
            self.set(val, el.value);
          });
          delete vdom.props["m-model"];
        }
        
        directives["m-for"] = function(el, val, vdom) {
          var parts = val.split(" in ");
          var alias = parts[0];
          var array = self.get(parts[1]);
        }
        
        directives["m-once"] = function(el, val, vdom) {
          vdom.val = el.textContent;
          for(var child in vdom.children) {
            vdom.children[child].val = compileTemplate(vdom.children[child].val, self.$data);
          }
        }
        
        directives["m-text"] = function(el, val, vdom) {
          el.textContent = val;
        }
        
        directives["m-html"] = function(el, val, vdom) {
          el.innerHTML = val;
        }
        
        directives["m-mask"] = function(el, val, vdom) {}
        

        /* ======= Initialize 🎉 ======= */
        this.init();
    }

    /* ======= Instance Methods ======= */
    
    var hasConsole = typeof window.console !== undefined;
    
    /**
    * Logs a Message
    * @param {String} msg
    */
    Moon.prototype.log = function(msg) {
      if(!config.silent && hasConsole) console.log(msg);
    }
    
    /**
    * Throws an Error
    * @param {String} msg
    */
    Moon.prototype.error = function(msg) {
      if(hasConsole) console.error("[Moon] ERR: " + msg);
    }
    
    /**
    * Sets Value in Data
    * @param {String} key
    * @param {String} val
    */
    Moon.prototype.set = function(key, val) {
      this.$data[key] = val;
      if(!this.$destroyed) this.build(this.$dom.children);
      this.$hooks.updated();
    }
    
    /**
    * Gets Value in Data
    * @param {String} key
    * @return {String} Value of key in data
    */
    Moon.prototype.get = function(key) {
      return this.$data[key];
    }
    
    /**
    * Calls a method
    * @param {String} method
    */
    Moon.prototype.method = function(method) {
      this.$methods[method]();
    }
    
    /**
    * Destroys Moon Instance
    */
    Moon.prototype.destroy = function() {
      Object.defineProperty(this, '$data', {
        set: function(value) {
          _data = value;
        }
      });
      this.$destroyed = true;
      this.$hooks.destroyed();
    }
    
    /**
    * Builds the DOM With Data
    * @param {Array} children
    */
    Moon.prototype.build = function(children) {
      for(var i = 0; i < children.length; i++) {
        var el = children[i];
    
        if(el.type === "#text") {
          el.node.textContent = compileTemplate(el.val, this.$data);
        } else if(el.props) {
          for(var prop in el.props) {
            var propVal = el.props[prop];
            var compiledProperty = compileTemplate(propVal, this.$data);
            var directive = directives[prop];
            if(directive) {
              el.node.removeAttribute(prop);
              directive(el.node, compiledProperty, el);
            }
    
            if(!directive) el.node.setAttribute(prop, compiledProperty);
          }
        }
    
        this.build(el.children);
      }
    }
    
    /**
    * Initializes Moon
    */
    Moon.prototype.init = function() {
      this.log("======= Moon =======");
      this.$hooks.created();
      this.$dom = createVirtualDOM(this.$el);
      this.build(this.$dom.children);
      this.$hooks.mounted();
    }
    

    /* ======= Global API ======= */
    
    /**
    * Sets the Configuration of Moon
    * @param {Object} opts
    */
    Moon.config = function(opts) {
      if(opts.silent) {
        config.silent = opts.silent;
      }
      if(opts.prefix) {
        config.prefix = opts.prefix;
      }
    }
    
    /**
    * Runs an external Plugin
    * @param {Object} plugin
    */
    Moon.use = function(plugin) {
      plugin.init(Moon);
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
    * @param {Function} action
    */
    Moon.component = function(name, opts) {
      var Parent = this;
      function MoonComponent() {
        Moon.call(this, opts);
      }
      MoonComponent.prototype = Object.create(Parent.prototype);
      MoonComponent.prototype.constructor = MoonComponent;
      var component = new MoonComponent();
      components[name] = component;
      return component;
    }
    

    window.Moon = Moon;
})(window);
