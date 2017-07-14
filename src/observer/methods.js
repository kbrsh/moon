/**
 * Sets Up Methods
 * @param {Object} instance
 * @param {Array} methods
 */
const initMethods = function(instance, methods) {
  const initMethod = function(methodName, method) {
    instance.$data[methodName] = method.bind(instance);
  }

  for(const method in methods) {
    initMethod(method, methods[method]);
  }
}
