/* ======= Default Directives ======= */

const emptyNode = `m("#text", {}, "")`;
const hashRE = /\.|\[/;

let ifDynamic = 0;
let ifStack = [];
let forStack = [];

const setIfState = function(state) {
  if(state.dynamic === false) {
    state.dynamic = true;
  } else {
    ifDynamic++;
  }
}

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
        let attrs = child.props;
        if(attrs["m-else"] !== undefined) {
          ifStack.push([i, child]);
          children.splice(i, 1);
          setIfState(state);
        } else if(attrs["m-if"] !== undefined) {
          setIfState(state);
        }
        break;
      }
    }
  },
  afterGenerate: function(prop, code, node, parentNode, state) {
    const value = prop.value;
    let elseValue = emptyNode;
    let elseNode = ifStack.pop();

    if(elseNode !== undefined) {
      elseValue = generateNode(elseNode[1], parentNode, elseNode[0], state);
    }

    if((--ifDynamic) === 0) {
      state.dynamic = false;
    }

    compileTemplateExpression(value, state.exclude, state.dependencies);

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
    forStack.push([iteratable, aliases, exclude]);
    state.exclude = exclude.concat(aliases.split(","));
    compileTemplateExpression(iteratable, exclude, state.dependencies);
  },
  afterGenerate: function(prop, code, node, parentNode, state) {
    // Get node with information about parameters
    const paramInformation = forStack.pop();

    // Restore globals to exclude
    state.exclude = paramInformation[2];

    // Use the renderLoop runtime helper
    return `m.renderLoop(${paramInformation[0]}, function(${paramInformation[1]}) { return ${code}; })`;
  }
};

specialDirectives["m-on"] = {
  beforeGenerate: function(prop, node, parentNode, state) {
    // Get list of modifiers
    let modifiers = prop.meta.arg.split(".");
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
    let modifiers = prop.meta.arg.split(".");

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

specialDirectives["m-mask"] = {

};

directives["m-show"] = function(el, val, node) {
  el.style.display = (val ? '' : 'none');
};
