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

    //=require util/util.js

    function Moon(opts) {
        /* ======= Initial Values ======= */
        this.$opts = opts || {};

        var self = this;
        var _data = this.$opts.data;

        this.$id = id++;
        this.$el = document.querySelector(this.$opts.el);
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

        //=require directives/default.js

        /* ======= Initialize 🎉 ======= */
        this.init();
    }

    //=require instance/methods.js

    //=require global/api.js

    return Moon;
}));
