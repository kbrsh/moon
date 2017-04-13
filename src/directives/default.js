/* ======= Default Directives ======= */

specialDirectives[Moon.config.prefix + "if"] = {
  afterGenerate: function(value, meta, code, vnode) {
    return `(${compileTemplate(value, delimiters, escapedDelimiters, false)}) ? ${code} : null`;
  }
}

specialDirectives[Moon.config.prefix + "show"] = {
  beforeGenerate: function(value, meta, vnode, parentVNode) {
    const runTimeShowDirective = {
      name: Moon.config.prefix + "show",
      value: compileTemplate(value, delimiters, escapedDelimiters, false),
      literal: true
    }

    vnode.props.directives.push(runTimeShowDirective);
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
    const iteratable = compileTemplate(parts[1], delimiters, escapedDelimiters, false);

    // Get any parameters
    const params = aliases.join(",");

    // Change any references to the parameters in children
    code.replace(new RegExp(`instance\\.get\\("(${aliases.join("|")})"\\)`, 'g'), function(match, alias) {
      code = code.replace(new RegExp(`instance.get\\("${alias}"\\)`, "g"), alias);
    });

    // Use the renderLoop runtime helper
    return `instance.renderLoop(${iteratable}, function(${params}) { return ${code}; })`;
  }
}

specialDirectives[Moon.config.prefix + "on"] = {
  beforeGenerate: function(value, meta, vnode) {

    // Extract modifiers and the event
    let rawModifiers = meta.arg.split(".");
    const eventToCall = rawModifiers[0];
    let params = "event";
    let methodToCall = compileTemplate(value, delimiters, escapedDelimiters, false);
    const rawParams = methodToCall.split("(");

    if(rawParams.length > 1) {
      methodToCall = rawParams.shift();
      params = rawParams.join("(").slice(0, -1);
    }
    var modifiers = "";

    rawModifiers.shift();

    for(var i = 0; i < rawModifiers.length; i++) {
      modifiers += eventModifiersCode[rawModifiers[i]];
    }

    var code = `function(event) {${modifiers}instance.callMethod("${methodToCall}", [${params}])}`;
    if(vnode.meta.eventListeners[eventToCall] === undefined) {
      vnode.meta.eventListeners[eventToCall] = [code]
    } else {
      vnode.meta.eventListeners[eventToCall].push(code);
    }
  }
}

specialDirectives[Moon.config.prefix + "model"] = {
  beforeGenerate: function(value, meta, vnode) {
    // Compile a string value for the keypath
    const compiledStringValue = compileTemplate(value, delimiters, escapedDelimiters, true);
    // Setup default event types and dom property to change
    let eventType = "input";
    let valueProp = "value";

    // If input type is checkbox, listen on 'change' and change the 'checked' dom property
    if(vnode.props.attrs.type !== undefined && vnode.props.attrs.type.value === "checkbox") {
      eventType = "change";
      valueProp = "checked";
    }

    // Generate event listener code
    const code = `function(event) {instance.set("${compiledStringValue}", event.target.${valueProp})}`;

    // Push the listener to it's event listeners
    if(vnode.meta.eventListeners[eventType] === undefined) {
      vnode.meta.eventListeners[eventType] = [code]
    } else {
      vnode.meta.eventListeners[eventType].push(code);
    }

    // Setup a query used to get the value, and set the corresponding dom property
    const getQuery = compileTemplate(`${delimiters[0]}${compileTemplate(value, delimiters, escapedDelimiters, false)}${delimiters[1]}`, delimiters, escapedDelimiters, false);
    if(vnode.props.dom === undefined) {
      vnode.props.dom = {};
    }
    vnode.props.dom[valueProp] = getQuery;
  }
};

specialDirectives[Moon.config.prefix + "literal"] = {
  duringPropGenerate: function(value, meta, vnode) {
    const prop = meta.arg;

    if(prop === "class") {
      // Classes need to be rendered differently
      return `"class": instance.renderClass(${compileTemplate(value, delimiters, escapedDelimiters, false)}), `;
    }
    return `"${prop}": ${compileTemplate(value, delimiters, escapedDelimiters, false)}, `;
  }
};

specialDirectives[Moon.config.prefix + "html"] = {
  beforeGenerate: function(value, meta, vnode) {
    if(vnode.props.dom === undefined) {
      vnode.props.dom = {};
    }
    vnode.props.dom.innerHTML = `"${compileTemplate(value, delimiters, escapedDelimiters, true)}"`;
  }
}

directives[Moon.config.prefix + "show"] = function(el, val, vnode) {
  el.style.display = (val ? '' : 'none');
}

directives[Moon.config.prefix + "mask"] = function(el, val, vnode) {

}
