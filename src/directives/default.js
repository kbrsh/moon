/* ======= Default Directives ======= */

const getterRE = /instance\.get\("[\w\d]+"\)/;

specialDirectives["m-if"] = {
  afterGenerate: function(value, meta, code, vnode, dependencies) {
    compileTemplateExpression(value, dependencies);
    return `${value} ? ${code} : h("#text", ${generateMeta(defaultMetadata())}, "")`;
  }
}

specialDirectives["m-for"] = {
  beforeGenerate: function(value, meta, vnode, parentVNode, dependencies) {
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
    return `instance.renderLoop(${iteratable}, function(${params}) { return ${code}; })`;
  }
}

specialDirectives["m-on"] = {
  beforeGenerate: function(value, meta, vnode, parentVNode, dependencies) {
    // Extract Event, Modifiers, and Parameters
    let methodToCall = value;

    let rawModifiers = meta.arg.split(".");
    const eventType = rawModifiers.shift();

    let params = "event";
    const rawParams = methodToCall.split("(");

    if(rawParams.length > 1) {
      // Custom parameters detected, update method to call, and generated parameter code
      methodToCall = rawParams.shift();
      params = rawParams.join("(").slice(0, -1);
      compileTemplateExpression(params, dependencies);
    }

    // Generate any modifiers
    let modifiers = "";
    for(var i = 0; i < rawModifiers.length; i++) {
      modifiers += eventModifiersCode[rawModifiers[i]];
    }

    // Final event listener code
    const code = `function(event) {${modifiers}instance.callMethod("${methodToCall}", [${params}])}`;
    const eventListeners = vnode.meta.eventListeners[eventType];
    if(eventListeners === undefined) {
      vnode.meta.eventListeners[eventType] = [code]
    } else {
      eventListeners.push(code);
    }
  }
}

specialDirectives["m-model"] = {
  beforeGenerate: function(value, meta, vnode, parentVNode, dependencies) {
    // Compile a literal value for the getter
    compileTemplateExpression(value, dependencies);

    // Setup default event types and dom property to change
    let eventType = "input";
    let valueProp = "value";

    // If input type is checkbox, listen on 'change' and change the 'checked' dom property
    if(vnode.props.attrs.type !== undefined && vnode.props.attrs.type.value === "checkbox") {
      eventType = "change";
      valueProp = "checked";
    }

    // Generate event listener code
    let keypath = value;

    // Compute getter if dynamic
    const bracketIndex = value.indexOf("[");
    const dotIndex = value.indexOf(".");
    let base = null;
    if(bracketIndex !== -1 && (dotIndex === -1 || bracketIndex < dotIndex)) {
      base = value.slice(0, bracketIndex);
    } else if(dotIndex !== -1 && (bracketIndex === -1 || dotIndex < bracketIndex)) {
      base = value.slice(0, dotIndex);
    }
    if(base !== null) {
      keypath = keypath.replace(expressionRE, function(match, reference) {
        if(reference !== undefined && reference !== base) {
          return `" + ${reference} + "`;
        } else {
          return match;
        }
      });
    }

    // Generate the listener
    const code = `function(event) {instance.set("${keypath}", event.target.${valueProp})}`;

    // Push the listener to it's event listeners
    const eventListeners = vnode.meta.eventListeners[eventType];
    if(eventListeners === undefined) {
      vnode.meta.eventListeners[eventType] = [code];
    } else {
      eventListeners.push(code);
    }

    // Setup a query used to get the value, and set the corresponding dom property
    const dom = vnode.props.dom;
    if(dom === undefined) {
      vnode.props.dom = dom = {};
    }
    dom[valueProp] = value;
  }
};

specialDirectives["m-literal"] = {
  duringPropGenerate: function(value, meta, vnode, dependencies) {
    const prop = meta.arg;
    compileTemplateExpression(value, dependencies);
    if(prop === "class") {
      // Detected class, use runtime class render helper
      return `"class": instance.renderClass(${value}), `;
    } else {
      // Default literal attribute
      return `"${prop}": ${value}, `;
    }
  }
};

specialDirectives["m-html"] = {
  beforeGenerate: function(value, meta, vnode, parentVNode, dependencies) {
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
