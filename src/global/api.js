/* ======= Global API ======= */

/**
 * Configuration of Moon
 */
Moon.config = {
  silent: ("__ENV__" === "production") || (typeof console === 'undefined'),
  prefix: "m-",
  delimiters: ["{{", "}}"],
  keyCodes: function(keyCodes) {
    for(var keyCode in keyCodes) {
      eventModifiersCode[keyCode] = `if(event.keyCode !== ${keyCodes[keyCode]}) {return;};`;
    }
  }
}

/**
 * Version of Moon
 */
Moon.version = '__VERSION__';

/**
 * Moon Utilities
 */
Moon.util = {
  noop: noop,
  error: error,
  log: log,
  merge: merge,
  extend: extend,
  h: h
}

/**
 * Runs an external Plugin
 * @param {Object} plugin
 * @param {Object} opts
 */
Moon.use = function(plugin, opts) {
  plugin.init(Moon, opts);
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
  directives[Moon.config.prefix + name] = action;
}

/**
 * Creates a Component
 * @param {String} name
 * @param {Function} action
 */
Moon.component = function(name, opts) {
  let Parent = this;

  if(opts.name) {
    name = opts.name;
  } else {
    opts.name = name;
  }

  function MoonComponent() {
    Moon.call(this, opts);
  }

  MoonComponent.prototype = Object.create(Parent.prototype);
  MoonComponent.prototype.constructor = MoonComponent;

  MoonComponent.prototype.init = function() {
    callHook(this, 'init');
    this.$destroyed = false;
    this.$props = this.$opts.props || [];

    this.$template = this.$opts.template;

    if(this.$render === noop) {
      this.$render = Moon.compile(this.$template);
    }
  }

  components[name] = {
    CTor: MoonComponent,
    opts: opts
  };

  return MoonComponent;
}
