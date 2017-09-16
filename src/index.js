"use strict";

/* ======= Global Variables ======= */
let directives = {};
let specialDirectives = {};
let components = {};

/* ======= Utilities ======= */
//=require util/util.js
//=require util/dom.js
//=require util/vdom.js

/* ======= Observer ======= */
//=require observer/methods.js
//=require observer/computed.js
//=require observer/observer.js

/* ======= Compiler ======= */
//=require compiler/constants.js
//=require compiler/template.js
//=require compiler/lexer.js
//=require compiler/parser.js
//=require compiler/generator.js
//=require compiler/compiler.js

function Moon(options) {
  /* ======= Initial Values ======= */

  // Options
  if(options === undefined) {
    options = {};
  }
  this.options = options;

  // Name/ID
  defineProperty(this, "name", options.name, "Root");

  // Root DOM Node
  this.root = undefined;

  // Data
  const data = options.data;
  if(data === undefined) {
    this.data = {};
  } else if(typeof data === "function") {
    this.data = data();
  } else {
    this.data = data;
  }

  // Methods
  const methods = options.methods;
  this.methods = {};
  if(methods !== undefined) {
    initMethods(this, methods);
  }

  // Compiled render function
  defineProperty(this, "compiledRender", options.render, noop);

  // Hooks
  defineProperty(this, "hooks", options.hooks, {});

  // Events
  this.events = {};

  // Virtual DOM
  this.dom = {};

  // Observer
  this.observer = new Observer();

  // Queued state
  this.queued = true;

  // Initialize computed properties
  const computed = options.computed;
  if(computed !== undefined) {
    initComputed(this, computed);
  }

  // Initialize
  this.init();
}

/* ======= Instance Methods ======= */
//=require instance/methods.js

/* ======= Global API ======= */
//=require global/api.js

/* ======= Default Directives ======= */
//=require directives/default.js
