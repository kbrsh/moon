"use strict";

/* ======= Global Variables ======= */
var directives = {};
var specialDirectives = {};
var components = {};
var eventModifiersCode = {
  stop: 'event.stopPropagation();',
  prevent: 'event.preventDefault();',
  ctrl: 'if(!event.ctrlKey) {return;};',
  shift: 'if(!event.shiftKey) {return;};',
  alt: 'if(!event.altKey) {return;};'
};
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

    this.$id = id++;

    this.$name = this.$opts.name || "root";
    this.$parent = this.$opts.parent || null;
    this.$data = this.$opts.data || {};
    this.$render = this.$opts.render || noop;
    this.$hooks = this.$opts.hooks || {};
    this.$methods = this.$opts.methods || {};
    this.$events = {};
    this.$dom = {};
    this.$destroyed = false;
    this.$initialRender = true;
    this.$queued = false;

    //=require directives/default.js

    /* ======= Initialize 🎉 ======= */
    this.init();
}

//=require instance/methods.js

//=require global/api.js
