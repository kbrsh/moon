"use strict";
(function(window) {

    /* ======= Global Variables ======= */
    var config = {
      silent: false
    }
    var directives = {};
    var components = {};

    //=require util/util.js 

    function Moon(opts) {
        /* ======= Initial Values ======= */
        var _el = opts.el;
        var _data = opts.data;
        var self = this;
        this.$el = document.querySelector(_el);
        this.$hooks = opts.hooks || {created: function() {}, mounted: function() {}, updated: function() {}, destroyed: function() {}};
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
          el.removeAttribute("m-on");
          delete vdom.props["m-on"];
        }

        directives["m-model"] = function(el, val, vdom) {
          el.value = self.get(val);
          el.addEventListener("input", function() {
            self.set(val, el.value);
          });
          el.removeAttribute("m-model");
          delete vdom.props["m-model"];
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

    /**
    * Logs a Message
    * @param {String} msg
    */
    Moon.prototype.log = function(msg) {
      if(!config.silent) console.log(msg);
    }

    /**
    * Throws an Error
    * @param {String} msg
    */
    Moon.prototype.error = function(msg) {
      console.log("Moon ERR: " + msg);
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
    Moon.prototype.createElement = function(type, children, val, props, node) {
      return {type: type, children: children, val: val, props: props, node: node};
    }

    /**
    * Create Elements Recursively For all Children
    * @param {Array} children
    * @return {Array} Array of elements usable in Virtual DOM
    */
    Moon.prototype.recursiveChildren = function(children) {
      var recursiveChildrenArr = [];
      for(var i = 0; i < children.length; i++) {
        var child = children[i];
        recursiveChildrenArr.push(this.createElement(child.nodeName, this.recursiveChildren(child.childNodes), child.textContent, extractAttrs(child), child));
      }
      return recursiveChildrenArr;
    }

    /**
    * Creates Virtual DOM
    * @param {Node} node
    */
    Moon.prototype.createVirtualDOM = function(node) {
      var vdom = this.createElement(node.nodeName, this.recursiveChildren(node.childNodes), node.textContent, extractAttrs(node), node);
      this.$dom = vdom;
    }

    /**
    * Sets Value in Data
    * @param {String} key
    * @param {String} val
    */
    Moon.prototype.set = function(key, val) {
      this.$data[key] = val;
      if(!this.$destroyed) this.build(this.$dom.children);
      if(this.$hooks.updated) {
        this.$hooks.updated();
      }
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
      if(this.$hooks.destroyed) this.$hooks.destroyed();
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
      if(this.$hooks.created) {
        this.$hooks.created();
      }
      this.createVirtualDOM(this.$el);
      this.build(this.$dom.children);
      if(this.$hooks.mounted) {
        this.$hooks.mounted();
      }
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
      components[name] = opts;
    }

    /**
    * Creates Subclass of Moon
    * @param {Object} opts
    */
    Moon.extend = function(opts) {
      var Parent = this;
      function MoonComponent() {
        Moon.call(this, opts);
      }
      MoonComponent.prototype = Object.create(Parent.prototype);
      MoonComponent.prototype.constructor = MoonComponent;
      return MoonComponent;
    }

    window.Moon = Moon;
})(window);
