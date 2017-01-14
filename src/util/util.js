/* ======= Global Utilities ======= */

/**
* Compiles a template with given data
* @param {String} template
* @param {Object} data
* @return {String} Template with data rendered
*/
var compileTemplate = function(template, data) {
  var code = template,
      templateRe = /{{([A-Za-z0-9_.()\[\]]+)}}/gi;
  code.replace(templateRe, function(match, key) {
    code = code.replace(match, "' + data['" + key + "'] + '");
  });
  code = code.replace("\n", "' + \n'");
  var compile = new Function("data", "var out = '" + code + "'; return out");
  var output = compile(data);
  return output;
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
    attrs[rawAttrs[i].name] = rawAttrs[i].value
  }

  return attrs;
}

/**
* Creates a Virtual DOM Node
* @param {String} type
* @param {Array} children
* @param {Object} props
* @return {Object} Node For Virtual DOM
*/
var createElement = function(type, val, props, children) {
  return {type: type, val: val, props: props, children: children};
}

/**
* Creates Virtual DOM
* @param {Node} node
* @return {Object} Virtual DOM
*/
var createVirtualDOM = function(node) {
  var children = [];
  for(var i = 0; i < node.childNodes.length; i++) {
    children.push(createVirtualDOM(node.childNodes[i]));
  }
  return createElement(node.nodeName, node.textContent, extractAttrs(node), children);
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
