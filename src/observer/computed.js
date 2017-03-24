/**
 * Makes Computed Properties for an Instance
 * @param {Object} instance
 * @param {Object} computed
 */
var initComputed = function(instance, computed) {
  var setComputedProperty = function(prop) {
    // Create dependency map
    instance.$observer.dep.map[prop] = [];

    // Create Getters/Setters
    var properties = {
      get: function() {
        // Property Cache
        var cache = null;
        // Any Dependencies of Computed Property
        var deps = instance.$observer.dep.map[prop];
        // If the computed property has changed
        var changed = true;

        // Iterate through dependencies, and see if any have been changed
        for(var i = 0; i < deps.length; i++) {
          changed = instance.$observer.dep.changed[deps[i]];
          if(changed) {
            break;
          }
        }

        if(changed) {
          // Dependencies changed, recalculate dependencies, cache the output, and return it
          instance.$observer.dep.target = prop;
          instance.$observer.dep.map[prop] = [];
          instance.$observer.dep.changed[prop] = true;
          cache = computed[prop].get.call(instance);
          instance.$observer.cache[prop] = cache;
          instance.$observer.dep.target = null;
        } else {
          // Dependencies didn't change, return cached value
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
