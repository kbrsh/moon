/**
 * Delimiters (updated every time generation is called)
 */
let delimiters = null;

/**
 * Escaped Delimiters
 */
let escapedDelimiters = null;

/**
 * Generates Code for Props
 * @param {Object} vnode
 * @param {Object} parentVNode
 * @return {String} generated code
 */
const generateProps = function(vnode, parentVNode, dependencies) {
	let attrs = vnode.props.attrs;
	let generatedObject = "{attrs: {";

	// Array of all directives (to be generated later)
	vnode.props.directives = [];

	// Invoke any special directives that need to change values before code generation
	for(let beforeAttr in attrs) {
		const beforeAttrInfo = attrs[beforeAttr];
		let beforeSpecialDirective = null;
		let beforeGenerate = null;

		if((beforeSpecialDirective = specialDirectives[beforeAttrInfo.name]) !== undefined && (beforeGenerate = beforeSpecialDirective.beforeGenerate) !== undefined) {
			beforeGenerate(beforeAttrInfo.value, beforeAttrInfo.meta, vnode, parentVNode, dependencies);
		}
	}

	// Generate all other attributes
	for(let attr in attrs) {
		// Attribute Info
		const attrInfo = attrs[attr];

		// Get attr by it's actual name (in case it had any arguments)
		const attrName = attrInfo.name;

		// Late bind for special directive
		let specialDirective = null;

		// If it is a directive, mark it as dynamic
		if((specialDirective = specialDirectives[attrName]) !== undefined) {
			// Generate Special Directives
			// Special directive found that generates code after initial generation, push it to its known special directives to run afterGenerate later
			let specialDirectivesAfter = vnode.specialDirectivesAfter;
			if(specialDirective.afterGenerate !== undefined) {
				if(specialDirectivesAfter === undefined) {
					vnode.specialDirectivesAfter = specialDirectivesAfter = {};
				}
				specialDirectivesAfter[attr] = attrInfo;
			}

			// Invoke any special directives that need to change values of props during code generation
			let duringPropGenerate = null;
			if((duringPropGenerate = specialDirective.duringPropGenerate) !== undefined) {
				generatedObject += duringPropGenerate(attrInfo.value, attrInfo.meta, vnode, dependencies);
			}

			// Keep a flag to know to always rerender this
			vnode.meta.shouldRender = true;

			// Remove special directive
			delete attrs[attr];
		} else if((attrName[0] + attrName[1]) === "m-") {
			vnode.props.directives.push(attrInfo);
			vnode.meta.shouldRender = true;
		} else {
			const propValue = attrInfo.value;
			const compiledProp = compileTemplate(propValue, delimiters, escapedDelimiters, dependencies, true);
			if(propValue !== compiledProp) {
				vnode.meta.shouldRender = true;
			}
			generatedObject += `"${attr}": "${compiledProp}", `;
		}
	}

	// Close object
	if(Object.keys(attrs).length !== 0) {
		generatedObject = generatedObject.slice(0, -2) + "}";
	} else {
		generatedObject += "}";
	}

	// Check for DOM Properties
	const dom = vnode.props.dom;
	if(dom !== undefined) {
		vnode.meta.shouldRender = true;
		// Add dom property
		generatedObject += ", dom: {";

		// Generate all properties
		for(var domProp in dom) {
			generatedObject += `"${domProp}": ${dom[domProp]}, `;
		}

		// Close object
		generatedObject = generatedObject.slice(0, -2) + "}";
	}

	// Check for Directives
	let allDirectives = vnode.props.directives;
	if(allDirectives.length !== 0) {
		generatedObject += ", directives: {";

		for(var i = 0; i < allDirectives.length; i++) {
			const directiveInfo = allDirectives[i];
			let directiveValue = directiveInfo.value;

			if(directiveValue.length !== 0) {
				compileTemplateExpression(directiveValue, dependencies);
			} else {
				directiveValue = "\"\"";
			}

			generatedObject += `"${directiveInfo.name}": ${directiveValue}, `;
		}

		// Close object
		generatedObject = generatedObject.slice(0, -2) + "}";
	}

	// Close the final generated object
	generatedObject += "}";
  return generatedObject;
}

/**
 * Generates Code for Event Listeners
 * @param {Object} listeners
 * @return {String} generated code
 */
const generateEventListeners = function(listeners) {
	// If no listeners, return empty object
	if(Object.keys(listeners).length === 0) {
		return "{}";
	}

	// Begin object
	let generatedObject = "{";

	// Generate an array for all listeners
	for(let type in listeners) {
		generatedObject += `"${type}": [${generateArray(listeners[type])}], `;
	}

	// Close object
	generatedObject = generatedObject.slice(0, -2) + "}";

  return generatedObject;
}

/**
 * Generates Code for Metadata
 * @param {Object} meta
 * @return {String} generated code
 */
const generateMeta = function(meta) {
	// Begin generated object
	let generatedObject = "{";

	// Generate all metadata
	for(let key in meta) {
		if(key === 'eventListeners') {
			generatedObject += `"${key}": ${generateEventListeners(meta[key])}, `;
		} else {
			generatedObject += `"${key}": ${meta[key]}, `;
		}
	}

	// Close object
	generatedObject = generatedObject.slice(0, -2) + "}";

  return generatedObject;
}

/**
 * Generates Code for an Array
 * @param {Array} arr
 * @return {String} generated array
 */
const generateArray = function(arr) {
	// Begin array
	let generatedArray = "";

	// Generate all items (literal expressions)
	for(let i = 0; i < arr.length; i++) {
		generatedArray += `${arr[i]}, `;
	}

	// Close array
	generatedArray = generatedArray.slice(0, -2);

  return generatedArray;
}

/**
 * Creates an "h" Call for a VNode
 * @param {Object} vnode
 * @param {Object} parentVNode
 * @param {Array} dependencies
 * @return {String} "h" call
 */
const createCall = function(vnode, parentVNode, dependencies) {
	// Generate Code for Type
	let call = `h("${vnode.type}", `;

	// Generate Code for Props
	call += generateProps(vnode, parentVNode, dependencies) + ", ";

	// Generate code for children recursively here (in case modified by special directives)
	let children = [];
	const parsedChildren = vnode.children;
	for(var i = 0; i < parsedChildren.length; i++) {
		children.push(generateEl(parsedChildren[i], vnode, dependencies));
	}

	// If the "shouldRender" flag is not present, ensure node will be updated
	if(vnode.meta.shouldRender === true && parentVNode !== undefined) {
		parentVNode.meta.shouldRender = true;
	}

	// Generate Code for Metadata
	call += generateMeta(vnode.meta);

	// Generate Code for Children
	if(children.length !== 0) {
		if(vnode.deep === true) {
			// If deep, flatten it in the code
			call += `, [].concat.apply([], [${generateArray(children)}])`
		} else {
			// Not deep, generate a shallow array
			call += `, [${generateArray(children)}]`;
		}
	} else {
		// No children, empty array
		call += ", []";
	}

	// Close Call
	call += ")";
  return call;
}

const generateEl = function(vnode, parentVNode, dependencies) {
	let code = "";

	if(typeof vnode === "string") {
		// Escape newlines and double quotes, and compile the string
		const escapedString = vnode;
		const compiledText = compileTemplate(escapedString, delimiters, escapedDelimiters, dependencies, true);
		let textMeta = defaultMetadata();

		if(escapedString !== compiledText) {
			parentVNode.meta.shouldRender = true;
			textMeta.shouldRender = true;
		}

		code += `h("#text", ${generateMeta(textMeta)}, "${compiledText}")`;
	} else {
		// Recursively generate code for children

		// Generate Metadata
		vnode.meta = defaultMetadata();

		// Detect SVG Element
		if(vnode.isSVG === true) {
			vnode.meta.isSVG = true;
		}

		// Setup Nested Attributes within Properties
		vnode.props = {
			attrs: vnode.props
		}

		// Create a Call for the Element, or Register a Slot
		let compiledCode = "";

		if(vnode.type === "slot") {
			parentVNode.meta.shouldRender = true;
			parentVNode.deep = true;

			const slotNameAttr = vnode.props.attrs.name;
			compiledCode = `instance.$slots['${(slotNameAttr && slotNameAttr.value) || ("default")}']`;
		} else {
			compiledCode = createCall(vnode, parentVNode, dependencies);
		}

		// Check for Special Directives that change the code after generation and run them
		if(vnode.specialDirectivesAfter !== undefined) {
			for(let specialDirectiveAfterInfo in vnode.specialDirectivesAfter) {
				const specialDirectiveAfter = vnode.specialDirectivesAfter[specialDirectiveAfterInfo];
				compiledCode = specialDirectives[specialDirectiveAfter.name].afterGenerate(specialDirectiveAfter.value, specialDirectiveAfter.meta, compiledCode, vnode, dependencies);
			}
		}
		code += compiledCode;
	}
  return code;
}

const generate = function(ast) {
	// Get root element
	const root = ast.children[0];

	// Dependencies
	const dependencies = [];

	// Update delimiters if needed
	let newDelimeters = null;
	if((newDelimeters = Moon.config.delimiters) !== delimiters) {
		delimiters = newDelimeters;

		// Escape delimiters
		escapedDelimiters = new Array(2);
		escapedDelimiters[0] = escapeRegex(delimiters[0]);
		escapedDelimiters[1] = escapeRegex(delimiters[1]);
	}

	// Generate Rendering Code
	const rootCode = generateEl(root, undefined, dependencies);

	let dependenciesCode = "";
	for(var i = 0; i < dependencies.length; i++) {
		const dependency = dependencies[i];
		dependenciesCode += `var ${dependency} = instance.get("${dependency}");`;
	}

  const code = `var instance = this; ${dependenciesCode} return ${rootCode}`;

  try {
    return new Function("h", code);
  } catch(e) {
    error("Could not create render function");
    return noop;
  }
}
