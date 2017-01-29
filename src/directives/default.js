/* ======= Default Directives ======= */
directives[Moon.config.prefix + "if"] = {
  beforeGenerate: function(value, code, vnode) {
    return `(${compileTemplate(value)}) ? ${code} : ''`;
  }
}

directives[Moon.config.prefix + "show"] = function(el, val, vdom) {
  var evaluated = new Function("return " + val);
  if(!evaluated()) {
    el.style.display = 'none';
  } else {
    el.style.display = 'block';
  }
}

directives[Moon.config.prefix + "on"] = function(el, val, vdom) {
  var splitVal = val.split(":");
  var eventToCall = splitVal[0];
  var methodToCall = splitVal[1];
  if(self.$events[eventToCall]) {
    self.on(eventToCall, methodToCall);
  } else {
    el.addEventListener(eventToCall, function(e) {
      self.callMethod(methodToCall, [e]);
    });
  }
  delete vdom.props[Moon.config.prefix + "on"];
}

directives[Moon.config.prefix + "model"] = function(el, val, vdom) {
  el.value = self.get(val);
  el.addEventListener("input", function() {
    self.set(val, el.value);
  });
  delete vdom.props[Moon.config.prefix + "model"];
}

directives[Moon.config.prefix + "for"] = function(el, val, vdom) {
  var parts = val.split(" in ");
  var alias = parts[0];
  var array = self.get(parts[1]);
}

directives[Moon.config.prefix + "once"] = function(el, val, vdom) {
  vdom.meta.shouldRender = false;
}

directives[Moon.config.prefix + "text"] = function(el, val, vdom) {
  el.textContent = val;
}

directives[Moon.config.prefix + "html"] = function(el, val, vdom) {
  el.innerHTML = val;
}

directives[Moon.config.prefix + "mask"] = function(el, val, vdom) {

}
