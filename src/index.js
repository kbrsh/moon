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

    //=require global/api.js

    window.Moon = Moon;
})(window);
