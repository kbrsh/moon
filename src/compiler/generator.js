const newLineRE = /\n/g;
const doubleQuoteRE = /"/g;
const backslashRE = /\\/g;
const defaultMetadata = function() {
  return {
    shouldRender: false
  }
}
const escapeString = function(str) {
  return str.replace(backslashRE, "\\\\").replace(doubleQuoteRE, "\\\"").replace(newLineRE, "\\n");
}
const openRE = /\{\{/;
const closeRE = /\s*\}\}/;
const whitespaceRE = /\s/;
const expressionRE = /"[^"]*"|'[^']*'|\.\w*[a-zA-Z$_]\w*|\w*[a-zA-Z$_]\w*:|(\w*[a-zA-Z$_]\w*)/g;
const globals = ['true', 'false', 'undefined', 'null', 'NaN', 'typeof', 'in'];

/**
 * Compiles a Template
 * @param {String} template
 * @param {Array} dependencies
 * @param {Boolean} isString
 * @return {String} compiled template
 */
const compileTemplate = function(template, dependencies, isString) {
  let state = {
    current: 0,
    template: template,
    output: "",
    dependencies: dependencies
  };

  compileTemplateState(state, isString);

  return state.output;
}

const compileTemplateState = function(state, isString) {
  const template = state.template;
  const length = template.length;
  while(state.current < length) {
    // Match Text Between Templates
    const value = scanTemplateStateUntil(state, openRE);

    if(value) {
      state.output += escapeString(value);
    }

    // If we've reached the end, there are no more templates
    if(state.current === length) {
      break;
    }

    // Exit Opening Delimiter
    state.current += 2;

    // Consume whitespace
    scanTemplateStateForWhitespace(state);

    // Get the name of the opening tag
    let name = scanTemplateStateUntil(state, closeRE);

    // If we've reached the end, the tag was unclosed
    if(state.current === length) {
      if("__ENV__" !== "production") {
        error(`Expected closing delimiter "}}" after "${name}"`);
      }
      break;
    }

    if(name.length !== 0) {
      // Extract Variable References
      compileTemplateExpression(name, state.dependencies);

      // Add quotes if string
      if(isString) {
        name = `" + ${name} + "`;
      }

      // Generate code
      state.output += name;
    }

    // Consume whitespace
    scanTemplateStateForWhitespace(state);

    // Exit closing delimiter
    state.current += 2;
  }
}

const compileTemplateExpression = function(expr, dependencies) {
  expr.replace(expressionRE, function(match, reference) {
    if(reference !== undefined && dependencies.indexOf(reference) === -1 && globals.indexOf(reference) === -1) {
      dependencies.push(reference);
    }
  });

  return dependencies;
}

const scanTemplateStateUntil = function(state, re) {
  const template = state.template;
  const tail = template.substring(state.current);
  const length = tail.length;
  const idx = tail.search(re);

  let match = "";

  switch (idx) {
    case -1:
      match = tail;
      break;
    case 0:
      match = '';
      break;
    default:
      match = tail.substring(0, idx);
  }

  state.current += match.length;

  return match;
}

const scanTemplateStateForWhitespace = function(state) {
  const template = state.template;
  let char = template[state.current];
  while(whitespaceRE.test(char)) {
    char = template[++state.current];
  }
}















const generateEventlisteners = function(eventListeners) {
	let eventListenersCode = "{";

	for(let type in eventListeners) {
		let handlers = eventListeners[type];
		eventListenersCode += `"${type}": [`;

		for(let i = 0; i < handlers.length; i++) {
			eventListenersCode += handlers[i];
		}

		eventListenersCode = eventListenersCode.substring(0, eventListenersCode.length - 2) + "], ";
	}

	eventListenersCode = eventListenersCode.substring(0, eventListenersCode.length - 2) + "}";
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
		const escaped = escapeString(node);
		const compiled = compileTemplate(escaped, state.dependencies, true);
		let meta = defaultMetadata();

		if(escaped !== compiled) {
			meta.shouldRender = true;
			parent.meta.shouldRender = true;
		}

		return `h("#text", ${generateMeta(meta)}"${compiled}")`;
	}

	let call = `h("${node.type}", `;

	let meta = defaultMetadata();
	node.meta = meta;

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

	if(node.meta.shouldRender === true && parent !== undefined) {
		parent.meta.shouldRender = true;
	}

	call += generateMeta(meta);
	call += childrenCode;

	return call;
}

const generate = function(tree) {
	let root = tree.children[0];

	let state = {
		hasAttrs: false,
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

	return code;
	try {
    return new Function("h", code);
  } catch(e) {
    error("Could not create render function");
    return noop;
  }
}

