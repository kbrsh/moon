"use strict";

/* ======= Global Variables ======= */
let directives = {};
let specialDirectives = {};
let components = {};
let eventModifiersCode = {
  stop: 'event.stopPropagation();',
  prevent: 'event.preventDefault();',
  ctrl: 'if(!event.ctrlKey) {return;};',
  shift: 'if(!event.shiftKey) {return;};',
  alt: 'if(!event.altKey) {return;};',
  enter: 'if(event.keyCode !== 13) {return;};'
};
let id = 0;

/* ======= Observer ======= */
//=require observer/computed.js
//=require observer/observer.js

//=require util/util.js
//=require util/dom.js
//=require util/vdom.js

/* ======= Compiler ======= */
//=require compiler/template.js
//=require compiler/lexer.js
//=require compiler/parser.js
//=require compiler/generator.js
//=require compiler/compiler.js

function Moon(opts) {
    /* ======= Initial Values ======= */
    this.$opts = opts || {};

    // Reference to Instance
    const self = this;

    // Unique ID for Instance
    this.$id = id++;

    // Readable name (component name or "root")
    this.$name = this.$opts.name || "root";

    // Custom Data
    this.$data = this.$opts.data || {};

    // Render function
    this.$render = this.$opts.render || noop;

    // Hooks
    this.$hooks = this.$opts.hooks || {};

    // Custom Methods
    const methods = this.$opts.methods || {};

    const createMethod = function(methodName, method) {
      self.$data[methodName] = function() {
        return method.apply(self, arguments);
      }
    }

    for(const method in methods) {
      createMethod(method, methods[method]);
    }

    // Events
    this.$events = {};

    // Virtual DOM
    this.$dom = {};

    // Observer
    this.$observer = new Observer(this);

    // Destroyed State
    this.$destroyed = true;

    // State of Queue
    this.$queued = false;

    // Setup Computed Properties
    if(this.$opts.computed) {
      initComputed(this, this.$opts.computed);
    }

    /* ======= Initialize 🎉 ======= */
    this.init();
}

//=require instance/methods.js

//=require global/api.js

//=require directives/default.js
