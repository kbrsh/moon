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
const addEventListenerCodeToVNode = function(name, handler, vnode) {
  const meta = vnode.meta;
  let eventListeners = meta.eventListeners;
  if(eventListeners === undefined) {
    eventListeners = meta.eventListeners = {};
  }
  let eventHandlers = eventListeners[name];
  if(eventHandlers === undefined) {
    eventListeners[name] = [handler];
  } else {
    eventHandlers.push(handler);
  }
}
/* ======= Default Directives ======= */

const emptyVNode = `h("#text", {shouldRender: false}, "")`;
let directives = {};
let specialDirectives = {};

specialDirectives["m-if"] = {
  afterGenerate: function(value, meta, code, vnode, dependencies) {
    compileTemplateExpression(value, dependencies);
    return `${value} ? ${code} : ${emptyVNode}`;
  }
}

specialDirectives["m-for"] = {
  beforeGenerate: function(prop, vnode, parentVNode, state) {
    // Setup Deep Flag to Flatten Array
    parentVNode.deep = true;
  },
  afterGenerate: function(value, meta, code, vnode, dependencies) {
    // Get Parts
    const parts = value.split(" in ");
    // Aliases
    const aliases = parts[0].split(",");
    // The Iteratable
    const iteratable = parts[1];
    compileTemplateExpression(iteratable, dependencies);

    // Get any parameters
    const params = aliases.join(",");

    // Add aliases to scope
    for(let i = 0; i < aliases.length; i++) {
      const aliasIndex = dependencies.indexOf(aliases[i]);
      if(aliasIndex !== -1) {
        dependencies.splice(aliasIndex, 1);
      }
    }

    // Use the renderLoop runtime helper
    return `Moon.renderLoop(${iteratable}, function(${params}) { return ${code}; })`;
  }
}

specialDirectives["m-on"] = {
  beforeGenerate: function(prop, vnode, parentVNode, state) {
    // Extract Event, Modifiers, and Parameters
    let value = prop.value;
    let meta = prop.meta;

    let methodToCall = value;

    let rawModifiers = meta.arg.split(".");
    const eventType = rawModifiers.shift();

    let params = "event";
    const rawParams = methodToCall.split("(");

    if(rawParams.length > 1) {
      // Custom parameters detected, update method to call, and generated parameter code
      methodToCall = rawParams.shift();
      params = rawParams.join("(").slice(0, -1);
      compileTemplateExpression(params, state.dependencies);
    }

    // Generate any modifiers
    let modifiers = "";
    for(let i = 0; i < rawModifiers.length; i++) {
      const eventModifierCode = eventModifiersCode[rawModifiers[i]];
      if(eventModifierCode === undefined) {
        modifiers += `if(Moon.renderEventModifier(event.keyCode, "${rawModifiers[i]}") === false) {return null;};`
      } else {
        modifiers += eventModifierCode;
      }
    }

    // Final event listener code
    const code = `function(event) {${modifiers}instance.callMethod("${methodToCall}", [${params}])}`;
    addEventListenerCodeToVNode(eventType, code, vnode);
  }
}

specialDirectives["m-model"] = {
  beforeGenerate: function(prop, vnode, parentVNode, state) {
    // Get attributes
    const value = prop.value;
    const attrs = vnode.props.attrs;

    // Add dependencies for the getter and setter
    compileTemplateExpression(value, state.dependencies);

    // Setup default event type, keypath to set, value of setter, DOM property to change, and value of DOM property
    let eventType = "input";
    let domGetter = "value";
    let domSetter = value;
    let keypathGetter = value;
    let keypathSetter = `event.target.${domGetter}`;

    // If input type is checkbox, listen on 'change' and change the 'checked' DOM property
    let type = attrs.type;
    if(type !== undefined) {
      type = type.value;
      let radio = false;
      if(type === "checkbox" || (type === "radio" && (radio = true))) {
        eventType = "change";
        domGetter = "checked";

        if(radio === true) {
          let valueAttr = attrs.value;
          const valueAttrValue = valueAttr === undefined ? "null" : `"${compileTemplate(valueAttr.value, delimiters, escapedDelimiters, dependencies, true)}"`;
          domSetter = `${domSetter} === ${valueAttrValue}`;
          keypathSetter = valueAttrValue;
        } else {
          keypathSetter = `event.target.${domGetter}`;
        }
      }
    }

    // Compute getter base if dynamic
    const bracketIndex = keypathGetter.indexOf("[");
    const dotIndex = keypathGetter.indexOf(".");
    let base = null;
    let dynamicPath = null;
    let dynamicIndex = -1;

    if(bracketIndex !== -1 || dotIndex !== -1) {
      // Dynamic keypath found,
      // Extract base and dynamic path
      if(bracketIndex === -1) {
        dynamicIndex = dotIndex;
      } else if(dotIndex === -1) {
        dynamicIndex = bracketIndex;
      } else if(bracketIndex < dotIndex) {
        dynamicIndex = bracketIndex;
      } else {
        dynamicIndex = dotIndex;
      }
      base = value.substring(0, dynamicIndex);
      dynamicPath = value.substring(dynamicIndex);

      // Replace string references with actual references
      keypathGetter = base + dynamicPath.replace(expressionRE, function(match, reference) {
        if(reference !== undefined) {
          return `" + ${reference} + "`;
        } else {
          return match;
        }
      });
    }

    // Generate the listener
    const code = `function(event) {instance.set("${keypathGetter}", ${keypathSetter})}`;

    // Push the listener to it's event listeners
    addEventListenerCodeToVNode(eventType, code, vnode);

    // Setup a query used to get the value, and set the corresponding dom property
    const dom = vnode.props.dom;
    if(dom === undefined) {
      vnode.props.dom = dom = {};
    }
    dom[domGetter] = domSetter;
  }
};

specialDirectives["m-literal"] = {
  duringPropGenerate: function(value, meta, vnode, dependencies) {
    const prop = meta.arg;
    compileTemplateExpression(value, dependencies);
    if(prop === "class") {
      // Detected class, use runtime class render helper
      return `"class": Moon.renderClass(${value}), `;
    } else {
      // Default literal attribute
      return `"${prop}": ${value}, `;
    }
  }
};

specialDirectives["m-html"] = {
  beforeGenerate: function(prop, vnode, parentVNode, state) {
    const dom = vnode.props.dom;
    if(dom === undefined) {
      vnode.props.dom = dom = {};
    }
    compileTemplateExpression(value, dependencies);
    dom.innerHTML = `("" + ${value})`;
  }
}

specialDirectives["m-mask"] = {

}

directives["m-show"] = function(el, val, vnode) {
  el.style.display = (val ? '' : 'none');
}














const generateProps = function(node, parent, state) {
	const props = node.props;
	let directives = {};
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

	for(propKey in props) {
		const prop = props[propKey];
		const name = prop.name;

		if((specialDirective = specialDirectives[name]) !== undefined) {

		} else if(name[0] === "m" && name[1] === "-") {

		} else {
			const escaped = escapeString(prop.value);
			const compiled = compileTemplate(escaped, state.dependencies, true);

			if(escaped !== compiled) {
				node.meta.shouldRender = true;
				if(parent !== undefined) {
					parent.meta.shouldRender = true;
				}
			}

			if(state.hasAttrs === false) {
				state.hasAttrs = true;
			}
			propsCode += `"${propKey}": "${compiled}", `;
		}
	}

	if(state.hasAttrs === true) {
		propsCode = propsCode.substring(0, propsCode.length - 2) + "}}, ";
		state.hasAttrs = false;
	} else {
		propsCode += "}}, ";
	}

	return propsCode;
}

const generateEventlisteners = function(eventListeners) {
	let eventListenersCode = "\"eventListeners\": {";

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

	const propsCode = generateProps(node, parent, state);

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

	call += propsCode;
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

console.log(generate({
  "type": "ROOT",
  "children": [
    {
      "type": "div",
      "props": {
        "m-if": {
          "name": "m-if",
          "value": "true",
          "meta": {}
        }
      },
      "children": [
        {
          "type": "h1",
          "props": {
          	"class": {
          		"name": "class",
          		"value": "red",
          		"meta": {}
          	}
          },
          "children": [
            "static"
          ]
        },
        {
          "type": "h5",
          "props": {
          	"m-on:click": {
          		"name": "m-on",
          		"value": "handle",
          		"meta": {
          			"arg": "click"
          		}
          	}
          },
          "children": [
            "{{dynamic}}"
          ]
        },
        {
          "type": "p",
          "props": {
            "m-mask": {
              "name": "m-mask",
              "value": "",
              "meta": {}
            },
            "m-literal:hi": {
              "name": "m-literal",
              "value": "true",
              "meta": {
                "arg": "hi"
              }
            }
          },
          "children": []
        }
      ]
    }
  ]
}))