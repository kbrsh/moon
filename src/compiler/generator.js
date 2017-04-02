/**
 * Generates Code for Props
 * @param {Object} vnode
 * @return {String} generated code
 */
const generateProps = function(vnode) {
	let attrs = vnode.props.attrs;
	let generatedObject = "{attrs: {";

	if(attrs) {
		// Invoke any special directives that need to change values before code generation
		for(let beforeAttr in attrs) {
			const beforeAttrName = attrs[beforeAttr].name;
			if(specialDirectives[beforeAttrName] && specialDirectives[beforeAttrName].beforeGenerate) {
				specialDirectives[beforeAttrName].beforeGenerate(attrs[beforeAttr].value, attrs[beforeAttr].meta, vnode);
			}
		}

		// Generate all other attributes
		for(let attr in attrs) {
			// Get attr by it's actual name (in case it had any arguments)
			const attrName = attrs[attr].name;

			// If it is a directive, mark it as dynamic
			if(directives[attrName]) {
				vnode.dynamic = true;
			}
			if(specialDirectives[attrName]) {
				// Special directive found that generates code after initial generation, push it to its known special directives to run afterGenerate later
				if(specialDirectives[attrName].afterGenerate) {
					if(!vnode.specialDirectivesAfter) {
						vnode.specialDirectivesAfter = {};
					}
					vnode.specialDirectivesAfter[attr] = attrs[attr];
				}

				// Invoke any special directives that need to change values of props during code generation
				if(specialDirectives[attrName].duringPropGenerate) {
					generatedObject += specialDirectives[attrName].duringPropGenerate(attrs[attr].value, attrs[attr].meta, vnode);
				}

				// Keep a flag to know to always rerender this
				vnode.dynamic = true;

				// Remove special directive
				delete attrs[attr];
			} else {
				const normalizedProp = JSON.stringify(attrs[attr].value);
				const compiledProp = compileTemplate(normalizedProp, true);
				if(normalizedProp !== compiledProp) {
					vnode.dynamic = true;
				}
				generatedObject += `"${attr}": ${compiledProp}, `;
			}
		}

		if(Object.keys(attrs).length) {
			generatedObject = generatedObject.slice(0, -2) + "}";
		} else {
			generatedObject += "}";
		}
	}

	const dom = vnode.props.dom;
	if(dom) {
		vnode.dynamic = true;
		generatedObject += ", dom: {";
		for(var domProp in dom) {
			generatedObject += `"${domProp}": ${dom[domProp]}, `;
		}
		generatedObject = generatedObject.slice(0, -2) + "}";
	}

	// Close the generated object
	generatedObject += "}";
  return generatedObject;
}

/**
 * Generates Code for Event Listeners
 * @param {Object} listeners
 * @return {String} generated code
 */
const generateEventListeners = function(listeners) {
	if(Object.keys(listeners).length === 0) {
		return "{}";
	}
	let generatedObject = "{";

	for(let type in listeners) {
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
const generateMeta = function(meta) {
	let generatedObject = "{";

	for(let key in meta) {
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
const generateArray = function(arr) {
	let generatedArray = "";

	for(let i = 0; i < arr.length; i++) {
		generatedArray += `${arr[i]}, `;
	}

	generatedArray = generatedArray.slice(0, -2);

  return generatedArray;
}

/**
 * Creates an "h" Call for a VNode
 * @param {Object} vnode
 * @param {Object} parentVNode
 * @return {String} "h" call
 */
const createCall = function(vnode, parentVNode) {
	let call = `h("${vnode.type}", `;
	call += generateProps(vnode) + ", ";
	// Generate code for children recursively here (in case modified by special directives)
	const children = vnode.children.map(function(item) {
		return generateEl(item, vnode);
	});

	if(!vnode.dynamic) {
		vnode.meta.shouldRender = false;
	} else if(parentVNode) {
		parentVNode.dynamic = true;
	}

	call += generateMeta(vnode.meta);
	call += children.length ? ", [" + generateArray(children) + "]" : "";
	call += ")";
  return call;
}

const generateEl = function(el, parentEl) {
	let code = "";

	if(typeof el === "string") {
		// Escape newlines and double quotes, and compile the string
		const escapedString = escapeString(el);
		const compiledText = compileTemplate(escapedString, true);
		if(parentEl && escapedString !== compiledText) {
			parentEl.dynamic = true;
		}

		code += `"${compiledText}"`;
	} else {
		// Recursively generate code for children

		// Generate Metadata if not Already
		if(!el.meta) {
			el.meta = defaultMetadata();
		}

		// Detect SVG Element
		if(el.isSVG) {
			el.meta.isSVG = true;
		}

		// Setup Nested Attributes within Properties
		el.props = {
			attrs: el.props
		}

		// Create a Call for the Element, or Register a Slot
		var slotNameAttr = el.props.attrs.name;
		var compiledCode = el.type === "slot" ? `instance.$slots['${(slotNameAttr && slotNameAttr.value) || ("default")}']` : createCall(el, parentEl);

		// Check for Special Directives that change the code after generation and run them
		if(el.specialDirectivesAfter) {
			for(let specialDirectiveAfter in el.specialDirectivesAfter) {
				compiledCode = specialDirectives[el.specialDirectivesAfter[specialDirectiveAfter].name].afterGenerate(el.specialDirectivesAfter[specialDirectiveAfter].value, el.specialDirectivesAfter[specialDirectiveAfter].meta, compiledCode, el);
			}
		}
		code += compiledCode;
	}
  return code;
}

const generate = function(ast) {
	// Get root element
	const root = ast.children[0];
	// Begin Code
  const code = "var instance = this; return " + generateEl(root);

  try {
    return new Function("h", code);
  } catch(e) {
    error("Could not create render function");
    return noop;
  }
}
