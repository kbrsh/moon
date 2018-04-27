import Moon from "../index.js";

export const log = function(msg) {
  if(Moon.config.silent === false) {
    console.log(msg);
  }
}

export const error = function(msg) {
  if(Moon.config.silent === false) {
    console.error("[Moon] ERROR: " + msg);
  }
}

export const queueBuild = function(instance) {
  if(instance.queued === false) {
    instance.queued = true;
    setTimeout(function() {
      instance.build();
      instance.queued = false;
      callHook(instance, "updated");
    }, 0);
  }
}

export const callHook = function(instance, name) {
  const hook = instance.hooks[name];
  if(hook !== undefined) {
    hook.call(instance);
  }
}

export const defineProperty = function(obj, prop, value, def) {
  if(value === undefined) {
    obj[prop] = def;
  } else {
    obj[prop] = value;
  }
}

export const noop = function() {
  
}
