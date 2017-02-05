/**
 * Generates Code for an Object
 * @param {Object} obj
 * @return {String} generated object
 */
var generateObject = function(obj) {
	if(Object.keys(obj).length === 0) {
		return "{}"
	}

	var generatedObject = "{";

	for(var prop in obj) {
		generatedObject += `"${prop}": ${compileTemplate(JSON.stringify(obj[prop]), true)}, `;
	}
	generatedObject = generatedObject.slice(0, -2) + "}";

  return generatedObject;
}

/**
 * Generates Code for an Array
 * @param {Array} arr
 * @return {String} generated array
 */
var generateArray = function(arr) {
	var generatedArray = "";

	for(var i = 0; i < arr.length; i++) {
		generatedArray += `${arr[i]}, `;
	}

	generatedArray = generatedArray.slice(0, -2);

  return generatedArray;
}

/**
 * Creates an "h" Call for a VNode
 * @param {Object} vnode
 * @param {Array} children
 * @return {String} "h" call
 */
var createCall = function(vnode, children) {
	var call = `h("${vnode.type}", `;
	call += generateObject(vnode.props) + ", ";
	call += generateObject(vnode.meta) + ", ";
	call += generateArray(children);
	call += ")";

  return call;
}


// End util
var generateEl = function(el) {
	var code = "";

	if(typeof el === "string") {
		// Escape newlines and double quotes, and compile the string
		code += `"${compileTemplate(escapeString(el), true)}"`;
	} else {
		// Recursively generate code for children
		var childrenCode = el.children.map(generateEl);
		if(!el.meta) {
			el.meta = defaultMetadata();
		}
		var compiledCode = createCall(el, childrenCode);
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
	// Get root element
	var root = ast.children[0];
	// Begin Code
  var code = "var instance = this; return " + generateEl(root);

	console.log(code)

  try {
    return new Function("h", code);
  } catch(e) {
    error("Could not create render function");
    return noop;
  }
}
