/* ======= Default Directives ======= */
directives["m-if"] = function(el, val, vdom) {
  var evaluated = new Function("return " + val);
  if(!evaluated()) {
    el.textContent = "";
  } else {
    el.textContent = compileTemplate(vdom.val, self.$data);
  }
}

directives["m-show"] = function(el, val, vdom) {
  var evaluated = new Function("return " + val);
  if(!evaluated()) {
    el.style.display = 'none';
  } else {
    el.style.display = 'block';
  }
}

directives["m-on"] = function(el, val, vdom) {
  var splitVal = val.split(":");
  var eventToCall = splitVal[0];
  var methodToCall = splitVal[1];
  el.addEventListener(eventToCall, function() {
    self.method(methodToCall);
  });
  el.removeAttribute("m-on");
  delete vdom.props["m-on"];
}

directives["m-model"] = function(el, val, vdom) {
  el.value = self.get(val);
  el.addEventListener("input", function() {
    self.set(val, el.value);
  });
  el.removeAttribute("m-model");
  delete vdom.props["m-model"];
}

directives["m-for"] = function(el, val, vdom) {
  var parts = val.split(" in ");
  var alias = parts[0];
  var array = self.get(parts[1]);
}

directives["m-once"] = function(el, val, vdom) {
  vdom.val = el.textContent;
  for(var child in vdom.children) {
    vdom.children[child].val = compileTemplate(vdom.children[child].val, self.$data);
  }
}

directives["m-text"] = function(el, val, vdom) {
  el.textContent = val;
}

directives["m-html"] = function(el, val, vdom) {
  el.innerHTML = val;
}

directives["m-mask"] = function(el, val, vdom) {}
