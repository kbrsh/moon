/* ======= Global Utilities ======= */

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
    attrs[rawAttrs[i].name] = rawAttrs[i].value
  }

  return attrs;
}

/**
* Compiles a template with given data
* @param {String} template
* @param {Object} data
* @return {String} Template with data rendered
*/
var compileTemplate = function(template, data) {
  var code = template,
      re = /{{([A-Za-z0-9_.()\[\]]+)}}/gi;
  code.replace(re, function(match, p) {
    code = code.replace(match, "` + data." + p + " + `");
  });
  var compile = new Function("data", "var out = `" + code + "`; return out");
  var output = compile(data);
  return output;
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
* Creates an object to be used in a Virtual DOM
* @param {String} type
* @param {Array} children
* @param {String} val
* @param {Object} props
* @param {Node} node
* @return {Object} Object usable in Virtual DOM
*/
var createElement = function(type, children, val, props, node) {
  return {type: type, children: children, val: val, props: props, node: node};
}

/**
* Create Elements Recursively For all Children
* @param {Array} children
* @return {Array} Array of elements usable in Virtual DOM
*/
var recursiveChildren = function(children) {
  var recursiveChildrenArr = [];
  for(var i = 0; i < children.length; i++) {
    var child = children[i];
    recursiveChildrenArr.push(createElement(child.nodeName, recursiveChildren(child.childNodes), child.textContent, extractAttrs(child), child));
  }
  return recursiveChildrenArr;
}

/**
* Creates Virtual DOM
* @param {Node} node
* @return {Object} Virtual DOM
*/
var createVirtualDOM = function(node) {
  var vdom = createElement(node.nodeName, recursiveChildren(node.childNodes), node.textContent, extractAttrs(node), node);
  return vdom;
}

/**
 * Compiles JSX to HTML
 * @param {String} tag
 * @param {Object} attrs
 * @param {Array} children
 * @return {String} HTML compiled from JSX
 */
 var h = function() {
 	var args = Array.prototype.slice.call(arguments);
 	var tag = args.shift();
   var attrs = args.shift() || {};
   var kids = args;
   var formattedAttrs = Object.keys(attrs).reduce(function(all, attr) {
   		return all + " " + attr + "='" + attrs[attr] + "'";
   }, '');
   var startTag = "<" + tag + formattedAttrs + ">";
   var endTag = "</" + tag + ">";
   var html = startTag + kids.join("") + endTag;
 	return html;
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
