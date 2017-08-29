/**
 * Makes Computed Properties for an Instance
 * @param {Object} instance
 * @param {Object} computed
 */
const initComputed = function(instance, computed) {
  let setComputedProperty = function(prop) {
    const observer = instance.observer;
    const option = computed[prop];
    const getter = option.get;
    const setter = option.set;

    // Add Getters
    Object.defineProperty(instance.data, prop, {
      get: function() {
        // Property Cache
        let cache;

        // If no cache, create it
        if(observer.cache[prop] === undefined) {
          // Capture Dependencies
          observer.target = prop;

          // Invoke getter
          cache = getter.call(instance);

          // Stop Capturing Dependencies
          observer.target = undefined;

          // Store value in cache
          observer.cache[prop] = cache;
        } else {
          // Cache found, use it
          cache = observer.cache[prop];
        }

        return cache;
      },
      set: setter === undefined ? noop : function(val) {
        setter.call(instance, val);
      }
    });
  }

  // Set All Computed Properties
  for(let propName in computed) {
    setComputedProperty(propName);
  }
}
