var generateEl = function(el) {
	var code = "";
	if(typeof el === "string") {
		code += `"${el}"`;
	} else {
		// Recursively generate code for children
		el.children = el.children.map(generateEl);
		if(!el.meta) {
			el.meta = defaultMetadata();
		}
		var compiledCode = createCall(el);
		for(var prop in el.props) {
			if(specialDirectives[prop]) {
				compiledCode = specialDirectives[prop](el.props[prop], compiledCode, el);
			}
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

	// Compile Templates
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
