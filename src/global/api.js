/* ======= Global API ======= */

/**
 * Configuration of Moon
 */
Moon.config = {
  silent: false,
  prefix: "m-"
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
  extend: extend
}

/**
 * Runs an external Plugin
 * @param {Object} plugin
 */
Moon.use = function(plugin) {
  plugin.init(Moon);
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
  var Parent = this;
  function MoonComponent() {
    this.$name = name;
    this.$parent = Parent;
    Moon.call(this, opts);
  }
  MoonComponent.prototype = Object.create(Parent.prototype);
  MoonComponent.prototype.constructor = MoonComponent;

  MoonComponent.prototype.init = function() {
    this.$destroyed = false;
    this.$props = this.$opts.props || [];

    this.$template = this.$opts.template;

    if(this.$render === noop) {
      this.$render = Moon.compile(this.$template);
    }
  }

  var component = new MoonComponent();
  components[name] = component;
  return component;
}
