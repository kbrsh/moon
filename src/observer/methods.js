const initMethods = function(instance, methods) {
  let instanceMethods = instance.methods;

  const initMethod = function(methodName, method) {
    // Change context of method
    instanceMethods[methodName] = function() {
      return method.apply(instance, arguments);
    }
  }

  for(let method in methods) {
    initMethod(method, methods[method]);
  }
}
