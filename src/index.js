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

        //=require directives/default.js

        /* ======= Initialize 🎉 ======= */
        this.init();
    }

    //=require instance/methods.js

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
