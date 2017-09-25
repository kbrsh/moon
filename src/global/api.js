/**
 * Configuration of Moon
 */
Moon.config = {
  silent: ("__ENV__" === "production") || (typeof console === "undefined")
}

/**
 * Version of Moon
 */
Moon.version = "__VERSION__";

/**
 * Moon Utilities
 */
Moon.util = {
  noop: noop,
  log: log,
  error: error,
  m: m
}

/**
 * Runs an external Plugin
 * @param {Object} plugin
 * @param {Object} options
 */
Moon.use = function(plugin, options) {
  plugin.init(Moon, options);
}

/**
 * Compiles HTML to a Render Function
 * @param {String} template
 * @return {Function} render function
 */
Moon.compile = function(template) {
  return compile(template);
}

/**
 * Runs a Task After Update Queue
 * @param {Function} task
 */
Moon.nextTick = function(task) {
  setTimeout(task, 0);
}

/**
 * Creates a Directive
 * @param {String} name
 * @param {Function} action
 */
Moon.directive = function(name, action) {
  directives["m-" + name] = action;
}

/**
 * Creates a Component
 * @param {String} name
 * @param {Object} options
 */
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
