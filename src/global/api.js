Moon.config = {
  silent: ("__ENV__" === "production") || (typeof console === "undefined")
}

Moon.version = "__VERSION__";

Moon.util = {
  noop: noop,
  log: log,
  error: error,
  m: m
}

Moon.use = function(plugin, options) {
  plugin.init(Moon, options);
}

Moon.compile = function(template) {
  return compile(template);
}

Moon.nextTick = function(task) {
  setTimeout(task, 0);
}

Moon.directive = function(name, action) {
  directives["m-" + name] = action;
}

Moon.extend = function(name, options) {
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
