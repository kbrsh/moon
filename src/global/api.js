/* ======= Global API ======= */

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
  if(options.name !== undefined) {
    name = options.name;
  } else {
    options.name = name;
  }

  if(options.data !== undefined && typeof options.data !== "function") {
    error("In components, data must be a function returning an object");
  }

  function MoonComponent(componentOptions) {
    Moon.apply(this, [options]);

    if(componentOptions === undefined) {
      this.insert = [];
    } else {
      const root = componentOptions.root;
      const props = componentOptions.props;
      this.insert = componentOptions.insert;

      if(props !== undefined) {
        let data = this.data;
        for(let prop in props) {
          data[prop] = props[prop];
        }
      }

      if(root !== undefined) {
        this.mount(root);
      }
    }
  }

  MoonComponent.prototype = Object.create(this.prototype);
  MoonComponent.prototype.constructor = MoonComponent;

  MoonComponent.prototype.init = function() {
    const options = this.options;

    const template = options.template;
    this.template = template;

    if(this.compiledRender === noop) {
      this.compiledRender = Moon.compile(template);
    }

    callHook(this, "init");
  }

  components[name] = {
    CTor: MoonComponent,
    options: options
  };

  return MoonComponent;
}
