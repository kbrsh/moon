/* ======= Global API ======= */

/**
 * Configuration of Moon
 */
Moon.config = {
  silent: false,
  prefix: "m-"
}

/**
 * Runs an external Plugin
 * @param {Object} plugin
 */
Moon.use = function(plugin) {
  plugin.init(Moon);
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
    Moon.call(this, opts);
  }
  MoonComponent.prototype = Object.create(Parent.prototype);
  MoonComponent.prototype.constructor = MoonComponent;
  var component = new MoonComponent();
  components[name] = component;
  return component;
}

/**
 * Compiles HTML to a Render Function
 * @param {String} template
 * @return {Function} render function
 */
Moon.compile = function(template) {
  return compile(template);
}
