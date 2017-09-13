const hashRE = /\.|\[/;

const addEventListenerCodeToNode = function(name, handler, node) {
  const meta = node.meta;
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

const addDomPropertyCodeToNode = function(name, code, node) {
  let dom = node.props.dom;
  if(dom === undefined) {
    node.props.dom = dom = {};
  }

  dom[name] = code;
}

specialDirectives["m-if"] = {
  beforeGenerate: function(prop, node, parentNode, state) {
    const children = parentNode.children;
    const index = state.index;

    for(let i = index + 1; i < children.length; i++) {
      let child = children[i];
      if(typeof child !== "string") {
        let data = prop.data;
        let attrs = child.props.attrs;

        if(attrs["m-else"] !== undefined) {
          data.elseNode = [i, child];
          children.splice(i, 1);

          if(state.dynamic === false) {
            state.dynamic = true;
            data.ifSetDynamic = true;
          }
        }

        break;
      }
    }

    node.meta.dynamic = 1;
  },
  afterGenerate: function(prop, code, node, parentNode, state) {
    const value = prop.value;
    const data = prop.data;
    let elseValue = "m.emptyVNode";
    let elseNode = data.elseNode;

    compileTemplateExpression(value, state.exclude, state.dependencies);

    if(elseNode !== undefined) {
      elseValue = generateNode(elseNode[1], parentNode, elseNode[0], state);
      if(data.ifSetDynamic === true) {
        state.dynamic = false;
      }
    }

    return `${value} ? ${code} : ${elseValue}`;
  }
};

specialDirectives["m-for"] = {
  beforeGenerate: function(prop, node, parentNode, state) {
    // Setup Deep Flag to Flatten Array
    parentNode.deep = true;

    // Parts
    const parts = prop.value.split(" in ");

    // Aliases
    const aliases = parts[0];

    // Save information
    const iteratable = parts[1];
    const exclude = state.exclude;
    prop.data.forInfo = [iteratable, aliases, exclude];
    state.exclude = exclude.concat(aliases.split(','));
    compileTemplateExpression(iteratable, exclude, state.dependencies);

    // Mark as dynamic
    node.meta.dynamic = 1;
  },
  afterGenerate: function(prop, code, node, parentNode, state) {
    // Get information about parameters
    const forInfo = prop.data.forInfo;

    // Restore globals to exclude
    state.exclude = forInfo[2];

    // Use the renderLoop runtime helper
    return `m.renderLoop(${forInfo[0]}, function(${forInfo[1]}) {return ${code};})`;
  }
};

specialDirectives["m-on"] = {
  beforeGenerate: function(prop, node, parentNode, state) {
    // Get event type
    const eventType = prop.arg;

    // Get method code
    let methodCode = prop.value;
    if(methodCode.indexOf('(') === -1) {
      methodCode += "(event)";
    }

    // Compile method code
    if(compileTemplateExpression(methodCode, state.exclude, state.dependencies) === true) {
      node.meta.dynamic = 1;
    }

    // Generate event listener code and install handler
    addEventListenerCodeToNode(eventType, `function(event) {${methodCode};}`, node);
  }
};

specialDirectives["m-bind"] = {
  beforeGenerate: function(prop, node, parentNode, state) {
    let value = prop.value;

    compileTemplateExpression(value, state.exclude, state.dependencies);

    const dynamicIndex = value.search(hashRE);
    let base;
    let properties;
    if(dynamicIndex !== -1) {
      base = value.substring(0, dynamicIndex);
      properties = value.substring(dynamicIndex);
      value = `instance.get("${base}")${properties}`;
    }

    let eventType = "input";
    let instanceKey = value;
    let instanceValue = "event.target.value";
    let domKey = "value";
    let domValue = value;
    let code = '';

    if(dynamicIndex === -1) {
      code = `function(event) {instance.set("${instanceKey}", ${instanceValue});}`;
    } else {
      code = `function(event) {var boundValue = instance.get("${base}");boundValue${properties} = ${instanceValue};instance.set("${base}", boundValue);}`;
    }

    node.meta.dynamic = 1;
    addEventListenerCodeToNode(eventType, code, node);
    addDomPropertyCodeToNode(domKey, domValue, node);
  }
};

specialDirectives["m-literal"] = {
  duringPropGenerate: function(prop, node, parentNode, state) {
    let modifiers = prop.arg.split('.');
    const propName = modifiers.shift();
    const propValue = prop.value;

    if(compileTemplateExpression(propValue, state.exclude, state.dependencies) === true) {
      node.meta.dynamic = 1;
    }

    if(modifiers[0] === "dom") {
      // Literal DOM property
      addDomPropertyCodeToNode(propName, propValue, node);
      return '';
    } else if(propName === "class") {
      // Detect class at runtime
      return `"class": m.renderClass(${propValue}), `;
    } else {
      // Literal attribute
      return `"${propName}": ${propValue}, `;
    }
  }
};

specialDirectives["m-static"] = {
  beforeGenerate: function(prop, node, parentNode, state) {
    if(state.static === false) {
      prop.data.staticSet = true;
      state.static = true;
    }
  },
  afterGenerate: function(prop, code, node, parentNode, state) {
    if(prop.data.staticSet === true) {
      state.static = false;
    }

    return code;
  }
};

specialDirectives["m-mask"] = {

};

directives["m-show"] = function(el, val, node) {
  el.style.display = (val ? '' : "none");
};
