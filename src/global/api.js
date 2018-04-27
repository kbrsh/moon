import Moon from "../index.js";

import {m} from "../util/vdom.js";
import {directives, components} from "./var.js";
import {log, error, callHook, noop} from "../util/util.js";
import {compile as _compile} from "../compiler/compiler.js";

const config = {
  silent: ("__ENV__" === "production") || (typeof console === "undefined")
}

const version = "__VERSION__";

const util = {
  noop: noop,
  log: log,
  error: error,
  m: m
}

const use = function(plugin, options) {
  plugin.init(Moon, options);
}

const compile = function(template) {
  return _compile(template);
}

const nextTick = function(task) {
  setTimeout(task, 0);
}

const directive = function(name, action) {
  directives["m-" + name] = action;
}

const extend = function(name, options) {
  options.name = name;

  if(options.data !== undefined && typeof options.data !== "function") {
    error("In components, data must be a function returning an object");
  }

  function MoonComponent(componentOptions) {
    this.componentOptions = componentOptions;
    Moon.apply(this, [options]);
  }

  MoonComponent.prototype = Object.create(Moon.prototype);
  MoonComponent.prototype.constructor = MoonComponent;

  MoonComponent.prototype.init = function() {
    const componentOptions = this.componentOptions;
    const props = componentOptions.props;
    let data = this.data;

    for(let prop in props) {
      data[prop] = props[prop];
    }

    this.events = componentOptions.events;
    this.insert = componentOptions.insert;

    callHook(this, "init");

    let root = componentOptions.root;
    if(root !== undefined) {
      this.mount(root);
    }
  }

  components[name] = {
    CTor: MoonComponent,
    options: options
  };

  return MoonComponent;
}

export default {config, version, util, use, compile, nextTick, directive, extend};
