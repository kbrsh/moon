/**
 * Initializes Methods
 * @param {Object} instance
 * @param {Array} methods
 */
const initMethods = function(instance, methods) {
  let data = instance.data;

  const initMethod = function(methodName, method) {
    if("__ENV__" !== "production" && data.hasOwnProperty(methodName) === true) {
      error(`Method "${methodName}" has the same key as a data property and will overwrite it`);
    }
    data[methodName] = function() {
      return method.apply(instance, arguments);
    }
  }

  for(let method in methods) {
    initMethod(method, methods[method]);
  }
}
