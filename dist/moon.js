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

    /* ======= Global Variables ======= */
    var config = {
      silent: false,
      prefix: "m-"
    }
    var directives = {};
    var components = {};

    /* ======= Global Utilities ======= */
    
    /**
    * Compiles a template with given data
    * @param {String} template
    * @param {Object} data
    * @return {String} Template with data rendered
    */
    var compileTemplate = function(template, data) {
      var code = template,
          templateRe = /{{([A-Za-z0-9_.()\[\]]+)}}/gi;
      code.replace(templateRe, function(match, key) {
        code = code.replace(match, "` + data[" + key + "] + `");
      });
      var compile = new Function("data", "var out = `" + code + "`; return out");
      var output = compile(data);
      return output;
    }
    
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
    * Creates a Virtual DOM Node
    * @param {String} type
    * @param {Array} children
    * @param {Object} props
    * @return {Object} Node For Virtual DOM
    */
    var createElement = function(type, val, props, children) {
      return {type: type, props: props, children: children};
    }
    
    /**
    * Creates Virtual DOM
    * @param {Node} node
    * @return {Object} Virtual DOM
    */
    var createVirtualDOM = function(node) {
      var children = [];
      for(var i = 0; i < node.childNodes.length; i++) {
        children.push(createVirtualDOM(node.childNodes[i]));
      }
      return createElement(node.nodeName, node.textContent, extractAttrs(node), children);
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
     * Compiles JSX to HTML
     * @param {String} tag
     * @param {Object} attrs
     * @param {Array} children
     * @return {String} HTML compiled from JSX
     */
     var h = function() {
     	 var args = Array.prototype.slice.call(arguments);
     	 var tag = args.shift();
       var attrs = args.shift() || {};
       var kids = args;
       var formattedAttrs = Object.keys(attrs).reduce(function(all, attr) {
       		return all + " " + attr + "='" + attrs[attr] + "'";
       }, '');
       var startTag = "<" + tag + formattedAttrs + ">";
       var endTag = "</" + tag + ">";
       var html = startTag + kids.join("") + endTag;
     	 return html;
     };
    
    /**
     * Sets the Elements Initial Value
     * @param {Node} el
     * @param {String} value
     */
    var setInitialElementValue = function(el, value) {
      el.innerHTML = value;
    }
    
    /**
     * Does No Operation
     */
    var noop = function() {
    
    }
    

    function Moon(opts) {
        /* ======= Initial Values ======= */
        opts = opts || {};
        var self = this;
        var _data = opts.data;
        this.$el = document.querySelector(opts.el);
        this.$template = opts.template || this.$el.innerHTML;
        this.$hooks = merge({created: noop, mounted: noop, updated: noop, destroyed: noop}, opts.hooks);
        this.$methods = opts.methods || {};
        this.$components = merge(opts.components || {}, components);
        this.$directives = merge(opts.directives || {}, directives);
        this.$dom = {};
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
        
        directives["m-mask"] = function(el, val, vdom) {
          
        }
        

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
        var vnode = this.$dom[i];
        var child = children[i];
    
        if(child.nodeName === "#text") {
          child.textContent = compileTemplate(vnode.template, this.$data);
        }
      }
    }
    
    /**
    * Initializes Moon
    */
    Moon.prototype.init = function() {
      this.log("======= Moon =======");
      this.$hooks.created();
      setInitialElementValue(this.$el, this.$template);
      this.$dom = createVirtualDOM(this.$el);
      this.build(this.$el.childNodes);
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
      directives[config.prefix + name] = action;
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
    

    return Moon;
}));
