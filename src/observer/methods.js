/**
 * Sets Up Methods
 * @param {Object} instance
 * @param {Array} methods
 */
const initMethods = function(instance, methods) {
  let data = instance.$data;

  const initMethod = function(methodName, method) {
    data[methodName] = function() {
      return method.apply(instance, arguments);
    }
  }

  for(const method in methods) {
    initMethod(method, methods[method]);
  }
}
