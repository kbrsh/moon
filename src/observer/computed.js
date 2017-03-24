/**
 * Makes Computed Properties for an Instance
 * @param {Object} instance
 * @param {Object} computed
 */
var initComputed = function(instance, computed) {
  var setComputedProperty = function(prop) {
    // Flush Cache if Dependencies Change
    instance.$observer.observe(prop);

    // Create Getters/Setters
    var properties = {
      get: function() {
        // Property Cache
        var cache = null;

        // If no cache, create it
        if(!instance.$observer.cache[prop]) {
          // Capture Dependencies
          instance.$observer.dep.target = prop;
          // Invoke getter
          cache = computed[prop].get.call(instance);
          // Stop Capturing Dependencies
          instance.$observer.dep.target = null;
          // Store value in cache
          instance.$observer.cache[prop] = cache;
        } else {
          // Cache found, use it
          cache = instance.$observer.cache[prop];
        }

        return cache;
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
