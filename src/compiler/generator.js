const generateProps = function(node, parent, state) {
	const props = node.props;
	node.props = {
		attrs: props
	}

	let hasDirectives = false;
	let directiveProps = [];

	let hasSpecialDirectivesAfter = false;
	let specialDirectivesAfter = {};

	let propKey = null;
	let specialDirective = null;

	let propsCode = "{attrs: {";

	let beforeGenerate = null;
	for(propKey in props) {
		const prop = props[propKey];
		const name = prop.name;
		if((specialDirective = specialDirectives[name]) !== undefined && (beforeGenerate = specialDirective.beforeGenerate) !== undefined) {
			beforeGenerate(prop, node, parent, state);
		}
	}

	let afterGenerate = null;
	let duringPropGenerate = null;
	for(propKey in props) {
		const prop = props[propKey];
		const name = prop.name;

		if((specialDirective = specialDirectives[name]) !== undefined) {
			if((afterGenerate = specialDirective.afterGenerate) !== undefined) {
				specialDirectivesAfter[name] = {
					prop: prop,
					afterGenerate: afterGenerate
				};

				hasSpecialDirectivesAfter = true;
			}

			if((duringPropGenerate = specialDirective.duringPropGenerate) !== undefined) {
				propsCode += duringPropGenerate(prop, node, state);
			}

			node.meta.shouldRender = true;
		} else if(name[0] === "m" && name[1] === "-") {
			directiveProps.push(prop);
			hasDirectives = true;
			node.meta.shouldRender = true;
		} else {
			const value = prop.value;
			const compiled = compileTemplate(value, state.dependencies, true);

			if(value !== compiled) {
				node.meta.shouldRender = true;
			}

			if(state.hasAttrs === false) {
				state.hasAttrs = true;
			}

			propsCode += `"${propKey}": "${compiled}", `;
		}
	}

	if(state.hasAttrs === true) {
		propsCode = propsCode.substring(0, propsCode.length - 2) + "}";
		state.hasAttrs = false;
	} else {
		propsCode += "}";
	}

	if(hasDirectives === true) {
		propsCode += ", directives: {";

		let directiveProp = null;
		let directivePropValue = null;
		for(let i = 0; i < directiveProps.length; i++) {
			directiveProp = directiveProps[i];
			directivePropValue = directiveProp.value;

			compileTemplateExpression(directivePropValue, state.dependencies);
			propsCode += `"${directiveProp.name}": ${directivePropValue.length === 0 ? "\"\"" : directivePropValue}, `;
		}

		propsCode = propsCode.substring(0, propsCode.length - 2) + "}";
	}

	if(hasSpecialDirectivesAfter === true) {
		state.specialDirectivesAfter = specialDirectivesAfter;
	}

	let domProps = node.props.dom;
	if(domProps !== undefined) {
		propsCode += ", dom: {";

		for(let domProp in domProps) {
			propsCode += `"${domProp}": ${domProps[domProp]}, `;
		}

		propsCode = propsCode.substring(0, propsCode.length - 2) + "}";
	}

	propsCode += "}, ";

	return propsCode;
}

const generateEventlisteners = function(eventListeners) {
	let eventListenersCode = "\"eventListeners\": {";

	for(let type in eventListeners) {
		let handlers = eventListeners[type];
		eventListenersCode += `"${type}": [`;

		for(let i = 0; i < handlers.length; i++) {
			eventListenersCode += `${handlers[i]}, `;
		}

		eventListenersCode = eventListenersCode.substring(0, eventListenersCode.length - 2) + "], ";
	}

	eventListenersCode = eventListenersCode.substring(0, eventListenersCode.length - 2) + "}, ";
	return eventListenersCode;
}

const generateMeta = function(meta) {
	let metaCode = "{";
	for(let key in meta) {
		if(key === "eventListeners") {
			metaCode += generateEventlisteners(meta[key])
		} else {
			metaCode += `"${key}": ${meta[key]}, `;
		}
	}

	metaCode = metaCode.substring(0, metaCode.length - 2) + "}, ";
	return metaCode;
}

const generateNode = function(node, parent, state) {
	if(typeof node === "string") {
		const compiled = compileTemplate(node, state.dependencies, true);
		let meta = defaultMetadata();

		if(node !== compiled) {
			meta.shouldRender = true;
			parent.meta.shouldRender = true;
		}

		return `m("#text", ${generateMeta(meta)}"${compiled}")`;
	} else if(node.type === "slot") {
		parent.meta.shouldRender = true;
		parent.deep = true;

		const slotName = node.props.name;
		return `instance.$slots["${slotName === undefined ? "default" : slotName.value}"]`;
	} else {
		let call = `m("${node.type}", `;

		let meta = defaultMetadata();
		node.meta = meta;

		const propsCode = generateProps(node, parent, state);
		let specialDirectivesAfter = state.specialDirectivesAfter;

		if(specialDirectivesAfter !== null) {
			state.specialDirectivesAfter = null;
		}

		let children = node.children;
		const childrenLength = children.length;
		let childrenCode = "[";

		if(childrenLength === 0) {
			childrenCode += "]";
		} else {
			for(let i = 0; i < children.length; i++) {
				childrenCode += `${generateNode(children[i], node, state)}, `;
			}
			childrenCode = childrenCode.substring(0, childrenCode.length - 2) + "]";
		}

		if(node.deep === true) {
			childrenCode = `[].concat.apply([], ${childrenCode})`;
		}

		if(node.meta.shouldRender === true && parent !== undefined) {
			parent.meta.shouldRender = true;
		}

		call += propsCode;
		call += generateMeta(meta);
		call += childrenCode;
		call += ")";

		if(specialDirectivesAfter !== null) {
			let specialDirectiveAfter;
			for(let specialDirectiveKey in specialDirectivesAfter) {
				specialDirectiveAfter = specialDirectivesAfter[specialDirectiveKey];
				call = specialDirectiveAfter.afterGenerate(specialDirectiveAfter.prop, call, node, state);
			}
		}

		return call;
	}
}

const generate = function(tree) {
	let root = tree.children[0];

	let state = {
		hasAttrs: false,
		specialDirectivesAfter: null,
		dependencies: []
	};

	const rootCode = generateNode(root, undefined, state);

	const dependencies = state.dependencies;
	let dependenciesCode = "";

	for(let i = 0; i < dependencies.length; i++) {
		const dependency = dependencies[i];
		dependenciesCode += `var ${dependency} = instance.get("${dependency}"); `;
	}

	const code = `var instance = this; ${dependenciesCode}return ${rootCode};`;

	try {
    return new Function("m", code);
  } catch(e) {
    error("Could not create render function");
    return noop;
  }
}
