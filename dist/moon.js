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
    var id = 0;

    /* ======= Global Utilities ======= */
    
    /**
    * Compiles a template with given data
    * @param {String} template
    * @param {Object} data
    * @return {String} Template with data rendered
    */
    var compileTemplate = function(template) {
      var code = template;
      var templateRe = /{{([A-Za-z0-9_.()\[\]]+)}}/gi;
      code.replace(templateRe, function(match, key) {
        code = code.replace(match, "' + data['" + key + "'] + '");
      });
      code = code.replace(/\n/g, "' + \n'");
      var compile = new Function("data", "var out = '" + code + "'; return out");
      return compile;
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
        attrs[rawAttrs[i].name] = compileTemplate(rawAttrs[i].value);
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
      return {type: type, val: val, props: props, children: children};
    }
    
    /**
    * Creates Virtual DOM
    * @param {Node} node
    * @return {Object} Virtual DOM
    */
    var createVirtualDOM = function(node) {
      var tag = node.nodeName;
      var content = compileTemplate(node.textContent);
      var attrs = extractAttrs(node);
    
      var children = [];
      for(var i = 0; i < node.childNodes.length; i++) {
        children.push(createVirtualDOM(node.childNodes[i]));
      }
      return createElement(tag, content, attrs, children);
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
     * Compiles JSX to Virtual DOM
     * @param {String} tag
     * @param {Object} attrs
     * @param {Array} children
     * @return {String} Object usable in Virtual DOM
     */
    var h = function() {
      var args = Array.prototype.slice.call(arguments);
      var tag = args.shift();
      var attrs = args.shift() || {};
      var children = args;
      return createElement(tag, children.join(""), attrs, children);
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
        this.$opts = opts || {};

        var self = this;
        var _data = this.$opts.data;

        this.$id = id++;
        this.$el = document.querySelector(this.$opts.el);

        if(!this.$el) {
          this.error("Element " + this.$opts.el + " not found");
        }
        
        this.$template = this.$opts.template || this.$el.innerHTML;
        this.$render = this.$opts.render || noop;
        this.$hooks = merge({created: noop, mounted: noop, updated: noop, destroyed: noop}, this.$opts.hooks);
        this.$methods = this.$opts.methods || {};
        this.$components = merge(this.$opts.components || {}, components);
        this.$directives = merge(this.$opts.directives || {}, directives);
        this.$dom = {};
        this.$destroyed = false;

        /* ======= Listen for Changes ======= */
        Object.defineProperty(this, '$data', {
            get: function() {
                return _data;
            },
            set: function(value) {
                _data = value;
                this.build(this.$el.childNodes, this.$dom.children);
            },
            configurable: true
        });

        /* ======= Default Directives ======= */
        directives[config.prefix + "if"] = function(el, val, vdom) {
          var evaluated = new Function("return " + val);
          if(!evaluated()) {
            el.textContent = "";
          } else {
            el.textContent = vdom.val(self.$data);
          }
        }
        
        directives[config.prefix + "show"] = function(el, val, vdom) {
          var evaluated = new Function("return " + val);
          if(!evaluated()) {
            el.style.display = 'none';
          } else {
            el.style.display = 'block';
          }
        }
        
        directives[config.prefix + "on"] = function(el, val, vdom) {
          var splitVal = val.split(":");
          var eventToCall = splitVal[0];
          var methodToCall = splitVal[1];
          el.addEventListener(eventToCall, function() {
            self.callMethod(methodToCall);
          });
          delete vdom.props[config.prefix + "on"];
        }
        
        directives[config.prefix + "model"] = function(el, val, vdom) {
          el.value = self.get(val);
          el.addEventListener("input", function() {
            self.set(val, el.value);
          });
          delete vdom.props[config.prefix + "model"];
        }
        
        directives[config.prefix + "for"] = function(el, val, vdom) {
          var parts = val.split(" in ");
          var alias = parts[0];
          var array = self.get(parts[1]);
        }
        
        directives[config.prefix + "once"] = function(el, val, vdom) {
          vdom.once = true;
        }
        
        directives[config.prefix + "text"] = function(el, val, vdom) {
          el.textContent = val;
        }
        
        directives[config.prefix + "html"] = function(el, val, vdom) {
          el.innerHTML = val;
        }
        
        directives[config.prefix + "mask"] = function(el, val, vdom) {
        
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
      if(!this.$destroyed) this.build(this.$el.childNodes, this.$dom.children);
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
    Moon.prototype.callMethod = function(method, args) {
      this.$methods[method].apply(this, args || []);
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
    Moon.prototype.build = function(children, vdom) {
      for(var i = 0; i < children.length; i++) {
        var vnode = vdom[i];
        var child = children[i];
        if(vnode !== undefined && !vnode.once) {
          var valueOfVNode = ""
          if(child.nodeName === "#text") {
            if(vnode.val) {
              valueOfVNode = vnode.val(this.$data);
            } else {
              valueOfVNode = vnode;
            }
            child.textContent = valueOfVNode;
          } else if(vnode.props) {
            for(var attr in vnode.props) {
              var compiledProp = vnode.props[attr](this.$data);
              if(directives[attr]) {
                child.removeAttribute(attr);
                directives[attr](child, compiledProp, vnode);
              } else {
                child.setAttribute(attr, compiledProp);
              }
            }
          }
    
          this.build(child.childNodes, vnode.children);
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
    
      if(this.$render !== noop) {
        this.$dom = this.$render(h);
      } else {
        this.$dom = createVirtualDOM(this.$el);
      }
    
      this.build(this.$el.childNodes, this.$dom.children);
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
        config.prefix = opts.prefix + "-";
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
