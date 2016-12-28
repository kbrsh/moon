/* ======= Global API ======= */

/**
* Sets the Configuration of Moon
* @param {Object} opts
*/
Moon.config = function(opts) {
  if(opts.silent) {
    config.silent = opts.silent;
  }
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
  directives["m-" + name] = action;
}

/**
* Creates a Component
* @param {String} name
* @param {Function} action
*/
Moon.component = function(name, opts) {
  components[name] = opts;
}

/**
* Creates Subclass of Moon
* @param {Object} opts
*/
Moon.extend = function(opts) {
  var Parent = this;
  function MoonComponent() {
    Moon.call(this, opts);
  }
  MoonComponent.prototype = Object.create(Parent.prototype);
  MoonComponent.prototype.constructor = MoonComponent;
  return MoonComponent;
}
