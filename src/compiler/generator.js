var generateEl = function(el) {
	var code = "";
	for(var i = 0; i < el.children.length; i++) {
  	var child = el.children[i];
    if(child.children) {
      child.children = child.children.map(function(c){
        return generateEl(c);
      });
    }
    if(typeof child === "string") {
      code += "h(null, null, \"" + child + "\")";
    } else {
      code += "h(\"" + child.type + "\", " + JSON.stringify(child.props) + ", " + child.children + ")";
    }
  }
  return code;
}

var generate = function(ast) {
  var TEMPLATE_RE = /{{([A-Za-z0-9_.()\[\]]+)}}/gi;
  var code = "return " + generateEl(ast);
  code.replace(TEMPLATE_RE, function(match, key) {
    code = code.replace(match, '" + data["' + key + '"] + "');
  });
  return new Function("h", code)
}
