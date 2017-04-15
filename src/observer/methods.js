/**
 * Sets Up Methods
 * @param {Object} instance
 */
const initMethods = function(instance, methods) {
  const initMethod = function(methodName, method) {
    instance.$data[methodName] = function() {
      return method.apply(self, arguments);
    }
  }

  for(const method in methods) {
    initMethod(method, methods[method]);
  }
}
