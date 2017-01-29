var generateEl = function(el) {
	var code = "";
	if(typeof el === "string") {
		code += `"${el}"`;
	} else {
		// Recursively generate code for children
		el.children = el.children.map(generateEl);
		var compiledCode = `h("${el.type}", ${JSON.stringify(el.props)}, ${el.children.join(",") || null})`;
		for(var prop in el.props) {
			if(directives[prop] && directives[prop].beforeGenerate) {
				compiledCode = directives[prop].beforeGenerate(el.props[prop], compiledCode, el);
			}
			delete directives[prop];
		}
		code += compiledCode;
	}
  return code;
}

var generate = function(ast) {
	var NEWLINE_RE = /\n/g;
	// Get root element
	var root = ast.children[0];
	// Begin Code
  var code = "return " + generateEl(root);

	// Compile Templates pass 13 fail 18
  code = compileTemplate(code, true);

	// Escape Newlines
	code = code.replace(NEWLINE_RE, `" + "\\n" + "`);

  try {
    return new Function("h", code);
  } catch(e) {
    error("Could not create render function");
    return noop;
  }
}
