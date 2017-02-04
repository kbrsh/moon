/* ======= Default Directives ======= */

specialDirectives[Moon.config.prefix + "if"] = function(value, code, vnode) {
  return `(${compileTemplate(value, false)}) ? ${code} : ''`;
}

specialDirectives[Moon.config.prefix + "for"] = function(value, code, vnode) {
  var parts = value.split(" in ");
  var aliases = parts[0].split(",");

  var iteratable = `instance.get("${parts[1]}")`;

  var params = aliases.join(",");

  var customCode = function(compiled, match, key, modifiers) {
    if(aliases.indexOf(key) === -1) {
      return compiled;
    }
    return compiled.replace(match, `" + ${key}${modifiers} + "`);
  }

  return `instance.renderLoop(${iteratable}, function(${params}) { return ${compileTemplate(code, true, customCode)}; })`;
}

specialDirectives[Moon.config.prefix + "on"] = function(value, code, vnode) {
  var eventModifiersCode = {
    stop: 'event.stopPropagation();',
    prevent: 'event.preventDefault();',
    ctrl: 'if(!event.ctrlKey) {return;};',
    shift: 'if(!event.shiftKey) {return;};',
    alt: 'if(!event.altKey) {return;};'
  };

  var splitVal = value.split(":");
  // Extract modifiers and the event
  var rawModifiers = splitVal[0].split(".");
  var eventToCall = rawModifiers[0];
  var modifiers = "";

  rawModifiers.shift();

  for(var i = 0; i < rawModifiers.length; i++) {
    var rawModifier = rawModifiers[i];
    if(Moon.config.keyCodes[rawModifier]) {
      modifiers += `if(event.keyCode !== ${Moon.config.keyCodes[rawModifier]}) {return;};`;
    } else if(eventModifiersCode[rawModifier]) {
      modifiers += eventModifiersCode[rawModifier];
    }
  }

  // Extract method to call afterwards
  var rawMethod = splitVal[1].split("(");
  var methodToCall = rawMethod[0];
  rawMethod.shift();
  var params = rawMethod.join(",").slice(0, -1);
  if(!params) {
    params = "event";
  }
  methodToCall += `(${params})`;

  // Code for all metadata
  var metadataCode = "{";
  // Code for the event listener
  var eventListenersCode = "{";

  // Add any listeners to the metadata first
  if(!vnode.meta.eventListeners[eventToCall]) {
    vnode.meta.eventListeners[eventToCall] = [{
      method: methodToCall,
      modifiers: modifiers
    }];
  } else {
    vnode.meta.eventListeners[eventToCall].push({
      method: methodToCall,
      modifiers: modifiers
    });
  }

  // Go through each type of event, and generate code with a function
  for(var eventType in vnode.meta.eventListeners) {
    var handlers = [];
    for(var i = 0; i < vnode.meta.eventListeners[eventType].length; i++) {
      var handler = vnode.meta.eventListeners[eventType][i];
      handlers.push(`function(event) {${handler.modifiers} instance.$methods.${handler.method}}`);
    }
    eventListenersCode += `${eventType}: [${handlers.join(",")}],`;
  }

  // Remove the ending comma, and close the object
  eventListenersCode = eventListenersCode.slice(0, -1);
  eventListenersCode += "}";

  vnode.meta.eventListeners = eventListenersCode;

  // Generate code for the metadata
  for(var key in vnode.meta) {
    metadataCode += `${key}: ${vnode.meta[key]},`;
  }

  // Remove ending comma, and close meta object
  metadataCode = metadataCode.slice(0, -1);
  metadataCode += "}";

  vnode.meta = metadataCode;

  return createCall(vnode, true);
}

specialDirectives[Moon.config.prefix + "model"] = function(value, code, vnode) {
  if(!vnode.meta.eventListeners["input"]) {
    vnode.meta.eventListeners["input"] = ["__MOON__MODEL__UPDATE__"];
  } else {
    vnode.meta.eventListeners["input"].push("__MOON__MODEL__UPDATE__");
  }
  return createCall(vnode);
}

specialDirectives[Moon.config.prefix + "once"] = function(value, code, vnode) {
  code = compileTemplate(code, false, function(compiled, match, key) {
    return compiled.replace(match, self.get(key));
  });
  return code;
}


directives[Moon.config.prefix + "model"] = function(el, val, vdom) {
  el.value = self.get(val);
}

directives[Moon.config.prefix + "show"] = function(el, val, vdom) {
  var evaluated = new Function("return " + val);
  if(!evaluated()) {
    el.style.display = 'none';
  } else {
    el.style.display = 'block';
  }
}

directives[Moon.config.prefix + "pre"] = function(el, val, vdom) {
  vdom.meta.shouldRender = false;
}

directives[Moon.config.prefix + "text"] = function(el, val, vdom) {
  el.textContent = val;
  for(var i = 0; i < vdom.children.length; i++) {
    vdom.children[i].meta.shouldRender = false;
  }
}

directives[Moon.config.prefix + "html"] = function(el, val, vdom) {
  el.innerHTML = val;
  for(var i = 0; i < vdom.children.length; i++) {
    vdom.children[i].meta.shouldRender = false;
  }
}

directives[Moon.config.prefix + "mask"] = function(el, val, vdom) {

}
