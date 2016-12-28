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
