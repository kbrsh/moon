"use strict";

import globalApi from "./global/api.js";
import instanceMethods from "./instance/methods.js";

import {Observer} from "./observer/observer.js";
import {initMethods} from "./observer/methods.js";
import {initComputed} from "./observer/computed.js";
import {defineProperty, noop} from "./util/util.js";

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

Moon.prototype.get = instanceMethods.get;
Moon.prototype.set = instanceMethods.set;
Moon.prototype.destroy = instanceMethods.destroy;
Moon.prototype.on = instanceMethods.on;
Moon.prototype.off = instanceMethods.off;
Moon.prototype.emit = instanceMethods.emit;
Moon.prototype.mount = instanceMethods.mount;
Moon.prototype.render = instanceMethods.render;
Moon.prototype.build = instanceMethods.build;
Moon.prototype.init = instanceMethods.init;

Moon.config = globalApi.config;
Moon.version = globalApi.version;
Moon.util = globalApi.util;
Moon.use = globalApi.use;
Moon.compile = globalApi.compile;
Moon.nextTick = globalApi.nextTick;
Moon.directive = globalApi.directive;
Moon.extend = globalApi.extend;

export default Moon;
