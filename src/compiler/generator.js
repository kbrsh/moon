var generateEl = function(el) {
	var code = "";
	for(var i = 0; i < el.children.length; i++) {
  	var child = el.children[i];
  	code += `createElement("${child.type}")`;
  }
  return code;
}

var generate = function(ast) {

  var code = JSON.stringify(ast);
  code.replace(TEMPLATE_RE, function(match, key) {
    code = code.replace(match, "' + data['" + key + "'] + '");
  });
  var render = new Function("data", "var out = '" + code + "'; return out");
  return render;
}

var generate = function(ast) {
  var TEMPLATE_RE = /{{([A-Za-z0-9_.()\[\]]+)}}/gi;
  var code = "return " + generateEl(ast);
  return new Function("createElement", code)
}
