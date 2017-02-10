/* ======= Default Directives ======= */

specialDirectives[Moon.config.prefix + "if"] = {
  afterGenerate: function(value, code, vnode) {
    return `(${compileTemplate(value, false)}) ? ${code} : ''`;
  }
}

specialDirectives[Moon.config.prefix + "for"] = {
  afterGenerate: function(value, code, vnode) {
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
}

specialDirectives[Moon.config.prefix + "on"] = {
  afterGenerate: function(value, code, vnode) {
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
  }
}

specialDirectives[Moon.config.prefix + "model"] = {};

specialDirectives[Moon.config.prefix + "once"] = {}

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
