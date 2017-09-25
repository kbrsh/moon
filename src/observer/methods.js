const initMethods = function(instance, methods) {
  let instanceMethods = instance.methods;
  for(let methodName in methods) {
    // Change context of method
    instanceMethods[methodName] = function() {
      return methods[methodName].apply(instance, arguments);
    }
  }
}
