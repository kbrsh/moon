/**
 * Makes Computed Properties for an Instance
 * @param {Object} instance
 * @param {Object} computed
 */
const initComputed = function(instance, computed) {
  const setComputedProperty = function(prop) {
    const observer = instance.observer;
    const option = computed[prop];
    const getter = option.get;
    const setter = option.set;

    // Add getter/setter
    Object.defineProperty(instance.data, prop, {
      get: function() {
        // Property Cache
        let cache;

        if(observer.cache[prop] === undefined) {
          // Capture dependencies
          observer.target = prop;

          // Invoke getter
          cache = getter.call(instance);

          // Stop capturing dependencies
          observer.target = undefined;

          // Store value in cache
          observer.cache[prop] = cache;
        } else {
          // Use cached value
          cache = observer.cache[prop];
        }

        return cache;
      },
      set: setter === undefined ? noop : function(val) {
        setter.call(instance, val);
      }
    });
  }

  // Set all computed properties
  for(let propName in computed) {
    setComputedProperty(propName);
  }
}
