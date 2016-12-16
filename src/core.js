"use strict";
(function(window) {
    function Moon(opts) {
        var _el = opts.el;
        var _data = opts.data;
        var _methods = opts.methods;
        var directives = {};
        this.$el = document.getElementById(_el);
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

        // Utility: Raw Attributes -> Key Value Pairs
        var extractAttrs = function(node) {
          var attrs = {};
          if(!node.attributes) return attrs;
          var rawAttrs = node.attributes;
          for(var i = 0; i < rawAttrs.length; i++) {
            attrs[rawAttrs[i].name] = rawAttrs[i].value
          }

          return attrs;
        }

        // Utility: Compile a template and return html
        var compileTemplate = function(template, data) {
          var code = template,
              re = /{{([.]?\w+)}}/gi;
          code.replace(re, function(match, p) {
            code = code.replace(match, "` + data." + p + " + `");
          });
          var compile = new Function("data", "var out = `" + code + "`; return out");
          return compile(data);
        }

        // Utility: Create Elements Recursively For all Children
        this.recursiveChildren = function(children) {
          var recursiveChildrenArr = [];
          for(var i = 0; i < children.length; i++) {
            var child = children[i];
            recursiveChildrenArr.push(this.createElement(child.nodeName, this.recursiveChildren(child.childNodes), child.textContent, extractAttrs(child), child));
          }
          return recursiveChildrenArr;
        }

        // Utility: Create Virtual DOM Instance
        this.createVirtualDOM = function(node) {
          var vdom = this.createElement(node.nodeName, this.recursiveChildren(node.childNodes), node.textContent, extractAttrs(node), node);
          this.dom = vdom;
        }

        // Build the DOM with $data
        this.build = function(children) {
          for(var i = 0; i < children.length; i++) {
            var el = children[i];

            if(el.type === "#text") {
              el.node.textContent = compileTemplate(el.val, this.$data);
            } else {
              for(var prop in el.props) {
                var propVal = el.props[prop];
                var compiledProperty = compileTemplate(propVal, this.$data);
                var directive = directives[prop];
                if(directive) {
                  directive(el.node, compiledProperty);
                }

                el.node.setAttribute(prop, compiledProperty);
              }
            }

            this.build(el.children);
          }
        }

        // Create Virtual DOM Object from Params
        this.createElement = function(type, children, val, props, node) {
          return {type: type, children: children, val: val, props: props, node: node};
        }

        // Set any value in $data
        this.set = function(key, val) {
          this.$data[key] = val;
          this.build(this.dom.children);
        }

        // Get any value in $data
        this.get = function(key) {
          return this.$data[key];
        }

        // Make AJAX GET/POST requests
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

        // Call a method defined in _methods
        this.method = function(method) {
          _methods[method]();
        }

        // Directive Initialization
        this.directive = function(name, action) {
          directives["m-" + name] = action;
          this.build(this.dom.children);
        }

        // Default Directives
        directives["m-if"] = function(el, val) {
          var evaluated = new Function("return " + val);
          if(!evaluated) {
            el.textContent = "";
          }
        }

        // Initialize
        this.createVirtualDOM(this.$el);
        this.build(this.dom.children);
    }

    window.Moon = Moon;
    window.$ = function(el) {
      el = document.querySelectorAll(el);
      return el.length === 1 ? el[0] : el;
    }

})(window);
