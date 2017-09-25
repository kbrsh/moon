const log = function(msg) {
  if(Moon.config.silent === false) {
    console.log(msg);
  }
}

const error = function(msg) {
  if(Moon.config.silent === false) {
    console.error("[Moon] ERROR: " + msg);
  }
}

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

const callHook = function(instance, name) {
  const hook = instance.hooks[name];
  if(hook !== undefined) {
    hook.call(instance);
  }
}

const defineProperty = function(obj, prop, value, def) {
  if(value === undefined) {
    obj[prop] = def;
  } else {
    obj[prop] = value;
  }
}

const noop = function() {
  
}
