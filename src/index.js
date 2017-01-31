"use strict";

/* ======= Global Variables ======= */
var directives = {};
var specialDirectives = {};
var components = {};
var id = 0;

//=require util/util.js

/* ======= Compiler ======= */
//=require compiler/lexer.js
//=require compiler/parser.js
//=require compiler/generator.js
//=require compiler/compiler.js

function Moon(opts) {
    /* ======= Initial Values ======= */
    this.$opts = opts || {};

    var self = this;
    var _data = this.$opts.data || {};

    this.$id = id++;

    this.$render = this.$opts.render || noop;
    this.$hooks = extend({created: noop, mounted: noop, updated: noop, destroyed: noop}, this.$opts.hooks);
    this.$methods = this.$opts.methods || {};
    this.$events = {};
    this.$dom = {};
    this.$destroyed = false;
    this.$initialRender = true;
    this.$queued = false;

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
