/**
 * Makes Computed Properties for an Instance
 * @param {Object} instance
 * @param {Object} computed
 */
var initComputed = function(instance, computed) {
  for(var prop in computed) {
    Object.defineProperty(instance.$data, prop, {
      get: function() {
        return computed[prop].get();
      }
    });
  }
}
