/**
 * Makes Computed Properties for an Instance
 * @param {Object} instance
 * @param {Object} computed
 */
var initComputed = function(instance, computed) {
  var setComputedProperty = function(prop) {
    var properties = {
      get: function() {
        return computed[prop].get.call(instance);
      }
    };
    if(computed[prop].set) {
      properties.set = function(val) {
        return computed[prop].set.call(instance, val);
      }
    }
    Object.defineProperty(instance.$data, prop, properties);
  }
  for(var propName in computed) {
    setComputedProperty(propName);
  }
}
