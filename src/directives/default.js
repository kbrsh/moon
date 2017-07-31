/* ======= Default Directives ======= */

const emptyVNode = `m("#text", ${generateMeta(defaultMetadata())}"")`;
const excludeEvent = globals.concat(["event"]);

specialDirectives["m-if"] = {
  afterGenerate: function(prop, code, vnode, state) {
    const value = prop.value;
    compileTemplateExpression(value, globals, state.dependencies);
    return `${value} ? ${code} : ${emptyVNode}`;
  }
}

specialDirectives["m-for"] = {
  beforeGenerate: function(prop, vnode, parentVNode, state) {
    // Setup Deep Flag to Flatten Array
    parentVNode.deep = true;
  },
  afterGenerate: function(prop, code, vnode, state) {
    // Get dependencies
    let dependencies = state.dependencies;

    // Get Parts
    const parts = prop.value.split(" in ");

    // Aliases
    const aliases = parts[0];

    // The Iteratable
    const iteratable = parts[1];
    compileTemplateExpression(iteratable, globals.concat(aliases.split(",")), dependencies);

    // Use the renderLoop runtime helper
    return `m.renderLoop(${iteratable}, function(${aliases}) { return ${code}; })`;
  }
}

specialDirectives["m-on"] = {
  beforeGenerate: function(prop, vnode, parentVNode, state) {
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
      compileTemplateExpression(params, excludeEvent, state.dependencies);
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
    const code = `function(event) {${modifiersCode}instance.callMethod("${methodToCall}", [${params}])}`;
    addEventListenerCodeToVNode(eventType, code, vnode);
  }
}

specialDirectives["m-model"] = {
  beforeGenerate: function(prop, vnode, parentVNode, state) {
    // Get attributes
    const value = prop.value;
    const attrs = vnode.props.attrs;

    // Get dependencies
    let dependencies = state.dependencies;

    // Add dependencies for the getter and setter
    compileTemplateExpression(value, globals, dependencies);

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
          let literalValueAttr = null;
          let valueAttrValue = "null";
          if(valueAttr !== undefined) {
            valueAttrValue = `"${compileTemplate(valueAttr.value, dependencies)}"`;
          } else if((literalValueAttr = attrs["m-literal:value"])) {
            valueAttrValue = `${compileTemplate(literalValueAttr.value, dependencies)}`;
          }
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
    let dom = vnode.props.dom;
    if(dom === undefined) {
      vnode.props.dom = dom = {};
    }
    dom[domGetter] = domSetter;
  }
};

specialDirectives["m-literal"] = {
  duringPropGenerate: function(prop, vnode, state) {
    const propName = prop.meta.arg;
    const propValue = prop.value;
    compileTemplateExpression(propValue, globals, state.dependencies);

    if(propName === "class") {
      // Detected class, use runtime class render helper
      return `"class": m.renderClass(${propValue}), `;
    } else {
      // Default literal attribute
      return `"${propName}": ${propValue}, `;
    }
  }
};

specialDirectives["m-html"] = {
  beforeGenerate: function(prop, vnode, parentVNode, state) {
    const value = prop.value;
    let dom = vnode.props.dom;
    if(dom === undefined) {
      vnode.props.dom = dom = {};
    }
    compileTemplateExpression(value, globals, state.dependencies);
    dom.innerHTML = `${value}`;
  }
}

specialDirectives["m-mask"] = {

}

directives["m-show"] = function(el, val, vnode) {
  el.style.display = (val ? '' : 'none');
}
