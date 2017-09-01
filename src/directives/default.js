/* ======= Default Directives ======= */

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
        let attrs = child.props;
        let ifChild;
        let elseNode;

        if(attrs["m-else"] !== undefined) {
          data.elseNode = [i, child];
          children.splice(i, 1);

          if(state.dynamic === false) {
            state.dynamic = true;
            data.ifSetDynamic = true;
          }
        } else if((ifChild = attrs["m-if"]) !== undefined) {
          if(state.dynamic === false) {
            if(data.ifSetDynamic === true) {
              delete data.ifSetDynamic;
            }
            
            state.dynamic = true;
            ifChild.data.ifSetDynamic = true;
          }
        }

        break;
      }
    }
  },
  afterGenerate: function(prop, code, node, parentNode, state) {
    const value = prop.value;
    const data = prop.data;
    let elseValue = "m.emptyVNode";
    let elseNode = data.elseNode;

    compileTemplateExpression(value, state.exclude, state.dependencies);

    if(elseNode !== undefined) {
      elseValue = generateNode(elseNode[1], parentNode, elseNode[0], state);
    }

    if(data.ifSetDynamic === true) {
      state.dynamic = false;
    }

    return `${value} ? ${code} : ${elseValue}`;
  }
};

specialDirectives["m-else"] = {

};

specialDirectives["m-for"] = {
  beforeGenerate: function(prop, node, parentNode, state) {
    // Setup Deep Flag to Flatten Array
    parentNode.deep = true;

    // Parts
    const parts = prop.value.split(" in ");

    // Aliases
    const aliases = parts[0];

    // Iteratable
    const iteratable = parts[1];
    const exclude = state.exclude;
    prop.data.forInfo = [iteratable, aliases, exclude];
    state.exclude = exclude.concat(aliases.split(","));
    compileTemplateExpression(iteratable, exclude, state.dependencies);
  },
  afterGenerate: function(prop, code, node, parentNode, state) {
    // Get information about parameters
    const forInfo = prop.data.forInfo;

    // Restore globals to exclude
    state.exclude = forInfo[2];

    // Use the renderLoop runtime helper
    return `m.renderLoop(${forInfo[0]}, function(${forInfo[1]}) { return ${code}; })`;
  }
};

specialDirectives["m-on"] = {
  beforeGenerate: function(prop, node, parentNode, state) {
    // Get list of modifiers
    let modifiers = prop.arg.split(".");
    const eventType = modifiers.shift();

    // Get method to call
    let methodToCall = prop.value;

    // Default parameters
    let params = "event";

    // Compile given parameters
    const paramStart = methodToCall.indexOf("(");
    if(paramStart !== -1) {
      const paramEnd = methodToCall.lastIndexOf(")");
      params = methodToCall.substring(paramStart + 1, paramEnd);
      methodToCall = methodToCall.substring(0, paramStart);
      compileTemplateExpression(params, state.exclude, state.dependencies);
    }

    // Generate any modifiers
    let modifiersCode = "";
    for(let i = 0; i < modifiers.length; i++) {
      const modifier = modifiers[i];
      const eventModifierCode = eventModifiersCode[modifier];
      if(eventModifierCode === undefined) {
        modifiersCode += `if(m.renderEventModifier(event.keyCode, "${modifier}") === false) {return null;};`
      } else {
        modifiersCode += eventModifierCode;
      }
    }

    // Generate event listener code and install handler
    const code = `function(event) {${modifiersCode}instance.callMethod("${methodToCall}", [${params}]);}`;
    addEventListenerCodeToNode(eventType, code, node);
  }
};

specialDirectives["m-model"] = {
  beforeGenerate: function(prop, node, parentNode, state) {
    const dependencies = state.dependencies;
    const exclude = state.exclude;
    let value = prop.value;

    compileTemplateExpression(value, exclude, dependencies);

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
    let code = "";

    if(dynamicIndex === -1) {
      code = `function(event) {instance.set("${instanceKey}", ${instanceValue});}`;
    } else {
      code = `function(event) {var modelValue = instance.get("${base}");modelValue${properties} = ${instanceValue};instance.set("${base}", modelValue);}`;
    }

    addEventListenerCodeToNode(eventType, code, node);
    addDomPropertyCodeToNode(domKey, domValue, node);
  }
};

specialDirectives["m-literal"] = {
  duringPropGenerate: function(prop, node, parentNode, state) {
    let modifiers = prop.arg.split(".");

    const propName = modifiers.shift();
    const propValue = prop.value;

    compileTemplateExpression(propValue, state.exclude, state.dependencies);

    if(modifiers[0] === "dom") {
      addDomPropertyCodeToNode(propName, propValue, node);
      return "";
    } else if(propName === "class") {
      // Detected class, use runtime class render helper
      return `"class": m.renderClass(${propValue}), `;
    } else {
      // Default literal attribute
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
  el.style.display = (val ? '' : 'none');
};
