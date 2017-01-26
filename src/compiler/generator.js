var generateEl = function(el) {
	var code = "";
	if(typeof el === "string") {
		code += `"${el}"`;
	} else {
		// Recursively generate code for children
		el.children = el.children.map(generateEl);
		code += `h("${el.type}", ${JSON.stringify(el.props)}, ${el.children.join(",")})`;
	}
  return code;
}

var generate = function(ast) {
	// Matches a template string
  var TEMPLATE_RE = /{{([A-Za-z0-9_.()\[\]]+)}}/gi;
	// Get root element
	var root = ast.children[0];
  var code = "return " + generateEl(root);

	// Compile Templates
  code.replace(TEMPLATE_RE, function(match, key) {
    code = code.replace(match, `" + this.get("${key}") + "`);
  });

  try {
    return new Function("h", code);
  } catch(e) {
    error("Could not create render function");
    return noop;
  }
}
