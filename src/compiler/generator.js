/**
 * Generates Code for Props
 * @param {Object} vnode
 * @return {String} generated code
 */
var generateProps = function(vnode) {
	var props = vnode.props;

	if(Object.keys(props).length === 0) {
		return "{}";
	}

	var generatedObject = "{";

	for(var prop in props) {
		if(specialDirectives[prop]) {
			if(specialDirectives[prop].beforeGenerate) {
				specialDirectives[prop].beforeGenerate(props[prop], vnode);
			}
		}
		generatedObject += `"${prop}": ${compileTemplate(JSON.stringify(props[prop]), true)}, `;
	}

	generatedObject = generatedObject.slice(0, -2) + "}";

  return generatedObject;
}

/**
 * Generates Code for Event Listeners
 * @param {Object} listeners
 * @return {String} generated code
 */
var generateEventListeners = function(listeners) {
	if(Object.keys(listeners).length === 0) {
		return "{}";
	}
	var generatedObject = "{";

	for(var type in listeners) {
		generatedObject += `"${type}": [${generateArray(listeners[type])}], `;
	}

	generatedObject = generatedObject.slice(0, -2) + "}";

  return generatedObject;
}

/**
 * Generates Code for Metadata
 * @param {Object} meta
 * @return {String} generated code
 */
var generateMeta = function(meta) {
	var generatedObject = "{";

	for(var key in meta) {
		if(key === 'eventListeners') {
			generatedObject += `"${key}": ${generateEventListeners(meta[key])}, `;
		} else {
			generatedObject += `"${key}": ${meta[key]}, `;
		}
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
	call += generateProps(vnode) + ", ";
	call += generateMeta(vnode.meta) + ", ";
	call += children.length ? generateArray(children) : "\"\"";
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
				if(specialDirectives[prop].afterGenerate) {
					compiledCode = specialDirectives[prop].afterGenerate(el.props[prop], compiledCode, el);
				}
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

  try {
    return new Function("h", code);
  } catch(e) {
    error("Could not create render function");
    return noop;
  }
}
