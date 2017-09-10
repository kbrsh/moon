/**
 * Logs a Message
 * @param {String} msg
 */
const log = function(msg) {
  if(Moon.config.silent === false) {
    console.log(msg);
  }
}

/**
 * Throws an Error
 * @param {String} msg
 */
const error = function(msg) {
  if(Moon.config.silent === false) {
    console.error("[Moon] ERROR: " + msg);
  }
}

/**
 * Adds DOM Updates to Queue
 * @param {Object} instance
 */
const queueBuild = function(instance) {
  if(instance.queued === false) {
    instance.queued = true;
    setTimeout(function() {
      instance.build();
      instance.queued = false;
      callHook(instance, "updated");
    }, 0);
  }
}

/**
 * Calls a Hook
 * @param {Object} instance
 * @param {String} name
 */
const callHook = function(instance, name) {
  const hook = instance.hooks[name];
  if(hook !== undefined) {
    hook.call(instance);
  }
}

/**
 * Defines a Property on an Object or a Default Value
 * @param {Object} obj
 * @param {String} prop
 * @param {Any} value
 * @param {Any} def
 */
const defineProperty = function(obj, prop, value, def) {
  if(value === undefined) {
    obj[prop] = def;
  } else {
    obj[prop] = value;
  }
}

/**
 * No Operation
 */
const noop = function() {

}
