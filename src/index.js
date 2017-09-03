"use strict";

/* ======= Global Variables ======= */
let directives = {};
let specialDirectives = {};
let components = {};

/* ======= Observer ======= */
//=require observer/methods.js
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

function Moon(options) {
    /* ======= Initial Values ======= */

    if("__ENV__" !== "production" && !(this instanceof Moon)) {
      error("Moon should be called with the `new` keyword and then you get a beautiful Moon instance")
    }
    // Options
    if(options === undefined) {
      options = {};
    }
    this.options = options;

    // Readable name/id
    defineProperty(this, "name", options.name, "root");

    // DOM Node to Mount
    this.root = undefined;

    // Custom Data
    const data = options.data;
    if(data === undefined) {
      this.data = {};
    } else if(typeof data === "function") {
      this.data = data();
    } else {
      this.data = data;
    }

    // Render function
    defineProperty(this, "compiledRender", options.render, noop);

    // Hooks
    defineProperty(this, "hooks", options.hooks, {});

    // Custom Methods
    const methods = options.methods;
    if(methods !== undefined) {
      initMethods(this, methods);
    }

    // Events
    this.events = {};

    // Virtual DOM
    this.dom = {};

    // Observer
    this.observer = new Observer(this);

    // State of Queue
    this.queued = true;

    // Setup Computed Properties
    const computed = options.computed;
    if(computed !== undefined) {
      initComputed(this, computed);
    }

    /* ======= Initialize 🎉 ======= */
    this.init();
}

//=require instance/methods.js

//=require global/api.js

//=require directives/default.js
