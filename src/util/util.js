/* ======= Global Utilities ======= */

/**
 * Creates Default Metadata
 * @return {Object} Metadata
 */
var defaultMeta = function() {
  return {
    shouldRender: true
  }
}

/**
 * Compiles a template with given data
 * @param {String} template
 * @return {String} Template Render Function
 */
var compileTemplate = function(template) {
  var code = template;
  var templateRe = /{{([A-Za-z0-9_.()\[\]]+)}}/gi;
  code.replace(templateRe, function(match, key) {
    code = code.replace(match, "' + data['" + key + "'] + '");
  });
  code = code.replace(/\n/g, "' + \n'");
  var compile = new Function("data", "var out = '" + code + "'; return out");
  return compile;
}

/**
 * Converts attributes into key-value pairs
 * @param {Node} node
 * @return {Object} Key-Value pairs of Attributes
 */
var extractAttrs = function(node) {
  var attrs = {};
  if(!node.attributes) return attrs;
  var rawAttrs = node.attributes;
  for(var i = 0; i < rawAttrs.length; i++) {
    attrs[rawAttrs[i].name] = rawAttrs[i].value;
  }

  return attrs;
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
    meta: meta
  };
}

/**
 * Adds Nodes to Rendered Virtual DOM
 * @param {Object} rdom
 * @param {Object} vdom
 * @return {Object} Rendered Virtual DOM with Nodes
 */
var addNodes = function(rdom, vdom) {
  rdom.node = vdom.node;
  for(var vnode in rdom.children) {
    rdom.children[vnode] = addNodes(rdom.children[vnode], vdom.children[vnode]);
  }
  return rdom;
}

/**
  * Gets Root Element
  * @param {String} html
  * @return {Node} Root Element
  */
var getRootElement = function(html) {
  var dummy = document.createElement('div');
  dummy.innerHTML = html;
  return dummy.firstChild;
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
    children[0] = createElement("#text", children[0], {}, [], defaultMeta())
  }
  return createElement(tag, children.join(""), attrs, children, defaultMeta());
};

/**
 * Sets the Elements Initial Value
 * @param {Node} el
 * @param {String} value
 */
var setInitialElementValue = function(el, value) {
  el.innerHTML = value;
}

/**
 * Does No Operation
 */
var noop = function() {

}
