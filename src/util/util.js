/* ======= Global Utilities ======= */

const hashRE = /\[(\w+)\]/g;
const RegExEscapeRE = /[\-\[\]{}()*+?.,\\\^$|#\s]/g;
const newLineRE = /\n/g;
const doubleQuoteRE = /"/g;
const backslashRE = /\\/g;

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
    console.error("[Moon] ERR: " + msg);
  }
}

/**
 * Adds DOM Updates to Queue
 * @param {Object} instance
 */
const queueBuild = function(instance) {
  if(instance.$queued === false && instance.$destroyed === false) {
    instance.$queued = true;
    setTimeout(function() {
      instance.build();
      callHook(instance, 'updated');
      instance.$queued = false;
    }, 0);
  }
}

/**
 * Gives Default Metadata for a VNode
 * @return {Object} metadata
 */
const defaultMetadata = function() {
  return {
    shouldRender: false,
    eventListeners: {}
  }
}

/**
 * Escapes a String
 * @param {String} str
 */
const escapeString = function(str) {
  return str.replace(backslashRE, "\\\\").replace(doubleQuoteRE, "\\\"").replace(newLineRE, "\\n");
}

/**
 * Resolves an Object Keypath and Sets it
 * @param {Object} instance
 * @param {Object} obj
 * @param {String} keypath
 * @param {String} val
 * @return {Object} resolved object
 */
const resolveKeyPath = function(instance, obj, keypath, val) {
  keypath = keypath.replace(hashRE, '.$1');
  var path = keypath.split(".");
  for(var i = 0; i < path.length - 1; i++) {
    const propName = path[i];
    obj = obj[propName];
  }
  obj[path[i]] = val;
  return path[0];
}

/**
 * Extracts the Slots From Component Children
 * @param {Array} children
 * @return {Object} extracted slots
 */
const getSlots = function(children) {
  let slots = {};

  // Setup default slots
  let defaultSlotName = "default";
  slots[defaultSlotName] = [];

  // No Children Means No Slots
  if(children.length === 0) {
    return slots;
  }

  // Get rest of the slots
  for(let i = 0; i < children.length; i++) {
    const child = children[i];
    const childProps = child.props.attrs;
    let slotName = "";

    if((slotName = childProps.slot) !== undefined) {
      if(slots[slotName] === undefined) {
        slots[slotName] = [child];
      } else {
        slots[slotName].push(child);
      }
      delete childProps.slot;
    } else {
      slots[defaultSlotName].push(child);
    }
  }

  return slots;
}

/**
 * Extends an Object with another Object's properties
 * @param {Object} parent
 * @param {Object} child
 * @return {Object} Extended Parent
 */
const extend = function(parent, child) {
  for(let key in child) {
    parent[key] = child[key];
  }
  return parent;
}

/**
 * Merges Two Objects Together
 * @param {Object} parent
 * @param {Object} child
 * @return {Object} Merged Object
 */
const merge = function(parent, child) {
  let merged = {};
  for(var key in parent) {
    merged[key] = parent[key];
  }
  for (var key in child) {
    merged[key] = child[key];
  }
  return merged;
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
 * Calls a Hook
 * @param {Object} instance
 * @param {String} name
 */
const callHook = function(instance, name) {
  const hook = instance.$hooks[name];
  if(hook !== undefined) {
    hook.call(instance);
  }
}

/**
 * Escapes String Values for a Regular Expression
 * @param {str} str
 */
const escapeRegex = function(str) {
  return str.replace(RegExEscapeRE, "\\$&");
}

/**
 * Does No Operation
 */
const noop = function() {

}
