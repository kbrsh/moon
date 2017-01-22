/* ======= Global Utilities ======= */

/**
 * Logs a Message
 * @param {String} msg
 */
var log = function(msg) {
  if(!Moon.config.silent) console.log(msg);
}

/**
 * Throws an Error
 * @param {String} msg
 */
var error = function(msg) {
  console.error("[Moon] ERR: " + msg);
}

/**
 * Creates a Virtual DOM Node
 * @param {String} type
 * @param {String} val
 * @param {Object} props
 * @param {Array} children
 * @param {Object} meta
 * @return {Object} Virtual DOM Node
 */
var createElement = function(type, val, props, children, meta) {
  return {
    type: type,
    val: val,
    props: props,
    children: children,
    meta: meta || {
      shouldRender: true
    }
  };
}

/**
 * Compiles JSX to Virtual DOM
 * @param {String} tag
 * @param {Object} attrs
 * @param {Array} children
 * @return {String} Object usable in Virtual DOM
 */
var h = function() {
  var args = Array.prototype.slice.call(arguments);
  var tag = args.shift();
  var attrs = args.shift() || {};
  var children = args;
  if(typeof children[0] === "string") {
    children[0] = createElement("#text", children[0], {}, [], null);
  }
  return createElement(tag, children.join(""), attrs, children, null);
};

/**
 * Compiles Template to Render Function
 * @param {String} template
 * @return {Function} Render Function
 */
var createRender = function(template) {

}

/**
 * Merges two Objects
 * @param {Object} obj
 * @param {Object} obj2
 * @return {Object} Merged Objects
 */
function merge(obj, obj2) {
  for (var key in obj2) {
    if (obj2.hasOwnProperty(key)) obj[key] = obj2[key];
  }
  return obj;
}

/**
 * Does No Operation
 */
var noop = function() {

}
