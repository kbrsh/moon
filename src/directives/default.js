/* ======= Default Directives ======= */

specialDirectives[Moon.config.prefix + "if"] = {
  afterGenerate: function(value, meta, code, vnode) {
    return `${compileTemplateExpression(value)} ? ${code} : h("#text", ${generateMeta(defaultMetadata())}, "")`;
  }
}

specialDirectives[Moon.config.prefix + "for"] = {
  beforeGenerate: function(value, meta, vnode, parentVNode) {
    // Setup Deep Flag to Flatten Array
    parentVNode.deep = true;
  },
  afterGenerate: function(value, meta, code, vnode) {
    // Get Parts
    const parts = value.split(" in ");
    // Aliases
    const aliases = parts[0].split(",");
    // The Iteratable
    const iteratable = compileTemplateExpression(parts[1]);

    // Get any parameters
    const params = aliases.join(",");

    // Change any references to the parameters in children
    code.replace(new RegExp(`instance\\.get\\("(${aliases.join("|")})"\\)`, 'g'), "$1");

    // Use the renderLoop runtime helper
    return `instance.renderLoop(${iteratable}, function(${params}) { return ${code}; })`;
  }
}

specialDirectives[Moon.config.prefix + "on"] = {
  beforeGenerate: function(value, meta, vnode) {
    // Extract Event, Modifiers, and Parameters
    let methodToCall = value;

    let rawModifiers = meta.arg.split(".");
    const eventToCall = rawModifiers.shift();

    let params = "event";
    const rawParams = methodToCall.split("(");

    if(rawParams.length > 1) {
      // Custom parameters detected, update method to call, and generated parameter code
      methodToCall = rawParams.shift();
      params = compileTemplateExpression(rawParams.join("(").slice(0, -1));
    }

    // Generate any modifiers
    let modifiers = "";
    for(var i = 0; i < rawModifiers.length; i++) {
      modifiers += eventModifiersCode[rawModifiers[i]];
    }

    // Final event listener code
    const code = `function(event) {${modifiers}instance.callMethod("${methodToCall}", [${params}])}`;
    const eventListeners = vnode.meta.eventListeners[eventToCall];
    if(eventListeners === undefined) {
      vnode.meta.eventListeners[eventToCall] = [code]
    } else {
      eventListeners.push(code);
    }
  }
}

specialDirectives[Moon.config.prefix + "model"] = {
  beforeGenerate: function(value, meta, vnode) {
    // Compile a string value for the keypath
    const compiledStringValue = compileTemplateExpression(value);

    // Setup default event types and dom property to change
    let eventType = "input";
    let valueProp = "value";

    // If input type is checkbox, listen on 'change' and change the 'checked' dom property
    if(vnode.props.attrs.type !== undefined && vnode.props.attrs.type.value === "checkbox") {
      eventType = "change";
      valueProp = "checked";
    }

    // Generate event listener code
    const code = `function(event) {instance.set(${compiledStringValue}, event.target.${valueProp})}`;

    // Push the listener to it's event listeners
    if(vnode.meta.eventListeners[eventType] === undefined) {
      vnode.meta.eventListeners[eventType] = [code];
    } else {
      vnode.meta.eventListeners[eventType].push(code);
    }

    // Setup a query used to get the value, and set the corresponding dom property
    if(vnode.props.dom === undefined) {
      vnode.props.dom = {};
    }
    vnode.props.dom[valueProp] = compiledStringValue;
  }
};

specialDirectives[Moon.config.prefix + "literal"] = {
  duringPropGenerate: function(value, meta, vnode) {
    const prop = meta.arg;

    if(prop === "class") {
      // Detected class, use runtime class render helper
      return `"class": instance.renderClass(${compileTemplateExpression(value)}), `;
    } else {
      // Default literal attribute
      return `"${prop}": ${compileTemplateExpression(value)}, `;
    }
  }
};

specialDirectives[Moon.config.prefix + "html"] = {
  beforeGenerate: function(value, meta, vnode) {
    if(vnode.props.dom === undefined) {
      vnode.props.dom = {};
    }
    vnode.props.dom.innerHTML = `("" + ${compileTemplateExpression(value)})`;
  }
}

specialDirectives[Moon.config.prefix + "mask"] = {

}

directives[Moon.config.prefix + "show"] = function(el, val, vnode) {
  el.style.display = (val ? '' : 'none');
}
