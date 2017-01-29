/* ======= Default Directives ======= */

specialDirectives[Moon.config.prefix + "if"] = function(value, code, vnode) {
  return `(${compileTemplate(value, false)}) ? ${code} : ''`;
}

specialDirectives[Moon.config.prefix + "for"] = function(value, code, vnode) {
  var parts = value.split(" in ");
  var alias = parts[0];
  var iteratable = `this.get("${parts[1]}")`;
  var customCode = function(compiled, match, key) {
    return compiled.replace(match, `" + ${key} + "`);
  }
  return `this.renderLoop(${iteratable}, function(${alias}) { return ${compileTemplate(code, true, customCode)}; })`;
}

specialDirectives[Moon.config.prefix + "on"] = function(value, code, vnode) {
  var splitVal = value.split(":");
  var eventToCall = splitVal[0];
  var methodToCall = splitVal[1];
  if(!vnode.meta.eventListeners[eventToCall]) {
    vnode.meta.eventListeners[eventToCall] = [methodToCall];
  } else {
    vnode.meta.eventListeners[eventToCall].push(methodToCall);
  }

  return createCall(vnode);
}

directives[Moon.config.prefix + "model"] = function(el, val, vdom) {
  el.value = self.get(val);
  el.addEventListener("input", function() {
    self.set(val, el.value);
  });
}

directives[Moon.config.prefix + "show"] = function(el, val, vdom) {
  var evaluated = new Function("return " + val);
  if(!evaluated()) {
    el.style.display = 'none';
  } else {
    el.style.display = 'block';
  }
}

directives[Moon.config.prefix + "once"] = function(el, val, vdom) {
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
