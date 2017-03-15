/**
 * Makes Computed Properties for an Instance
 * @param {Object} instance
 * @param {Object} computed
 */
var initComputed = function(instance, computed) {
  var setComputedProperty = function(prop) {
    // Add to Observer Cache
    instance.$observer.cache[prop] = {
      dirty: true,
      getter: computed[prop].get,
      cache: null
    };

    // Create Getters/Setters
    var properties = {
      get: function() {
        return instance.$observer.getComputed(prop)
      }
    };
    if(computed[prop].set) {
      properties.set = function(val) {
        return computed[prop].set.call(instance, val);
      }
    }

    // Add Getters/Setters
    Object.defineProperty(instance.$data, prop, properties);
  }

  // Set All Computed Properties
  for(var propName in computed) {
    setComputedProperty(propName);
  }
}
