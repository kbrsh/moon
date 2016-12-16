"use strict";
(function(window) {
    function Moon(opts) {
        var _el = opts.el;
        var _data = opts.data;
        var _methods = opts.methods;
        var directives = {};
        var self = this;
        this.$el = document.querySelector(_el);
        this.components = opts.components;
        this.dom = {type: this.$el.nodeName, children: [], node: this.$el};

        // Change state when $data is changed
        Object.defineProperty(this, '$data', {
            get: function() {
                return _data;
            },
            set: function(value) {
                _data = value;
                this.build(this.dom.children);
            }
        });

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
              re = /{{([.]?\w+)}}/gi;
          code.replace(re, function(match, p) {
            code = code.replace(match, "` + data." + p + " + `");
          });
          var compile = new Function("data", "var out = `" + code + "`; return out");
          return compile(data);
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
        this.createElement = function(type, children, val, props, node) {
          return {type: type, children: children, val: val, props: props, node: node};
        }

        /**
        * Create Elements Recursively For all Children
        * @param {Array} children
        * @return {Array} Array of elements usable in Virtual DOM
        */
        this.recursiveChildren = function(children) {
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
        this.createVirtualDOM = function(node) {
          var vdom = this.createElement(node.nodeName, this.recursiveChildren(node.childNodes), node.textContent, extractAttrs(node), node);
          this.dom = vdom;
        }

        /**
        * Turns Custom Components into their Corresponding Templates
        */
        this.componentsToHTML = function() {
          for(var component in this.components) {
            var componentsFound = document.getElementsByTagName(component);
            for(var i = 0; i < componentsFound.length; i++) {
              var componentFound = componentsFound[i];
              componentFound.outerHTML = this.components[component].template;
            }
          }
        }

        /**
        * Sets Value in Data
        * @param {String} key
        * @param {String} val
        */
        this.set = function(key, val) {
          this.$data[key] = val;
          this.build(this.dom.children);
        }

        /**
        * Gets Value in Data
        * @param {String} key
        * @return {String} Value of key in data
        */
        this.get = function(key) {
          return this.$data[key];
        }

        /**
        * Makes an AJAX Request
        * @param {String} method
        * @param {String} url
        * @param {Object} params
        * @param {Function} cb
        */
        this.ajax = function(method, url, params, cb) {
          var xmlHttp = new XMLHttpRequest();
          method = method.toUpperCase();
          if(typeof params === "function") {
            cb = params;
          }
          var urlParams = "?";
          if(method === "POST") {
            http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            for(var param in params) {
              urlParams += param + "=" + params[param] + "&";
            }
          }
          xmlHttp.onreadystatechange = function() {
          if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            cb(JSON.parse(xmlHttp.responseText));
          }
          xmlHttp.open(method, url, true);
          xmlHttp.send(method === "POST" ? urlParams : null);
        }

        /**
        * Calls a method
        * @param {String} method
        */
        this.method = function(method) {
          _methods[method]();
        }

        // Directive Initialization
        this.directive = function(name, action) {
          directives["m-" + name] = action;
        }

        // Default Directives
        directives["m-if"] = function(el, val, vdom) {
          var evaluated = new Function("return " + val);
          if(!evaluated()) {
            el.textContent = "";
          } else {
            el.textContent = compileTemplate(vdom.val, self.$data);
          }
        }

        /**
        * Builds the DOM With Data
        * @param {Array} children
        */
        this.build = function(children) {
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
                  directive(el.node, compiledProperty, el);
                }

                el.node.setAttribute(prop, compiledProperty);
              }
            }

            this.build(el.children);
          }
        }

        // Initialize 🎉
        this.componentsToHTML();
        this.createVirtualDOM(this.$el);
        this.build(this.dom.children);
    }

    window.Moon = Moon;
    window.$ = function(el) {
      el = document.querySelectorAll(el);
      return el.length === 1 ? el[0] : el;
    }

})(window);
