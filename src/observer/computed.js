import {noop} from "../util/util.js";

export const initComputed = function(instance, computed) {
  // Set all computed properties
  const data = instance.data;
  const observer = instance.observer;
  for(let propName in computed) {
    const option = computed[propName];
    const getter = option.get;
    const setter = option.set;

    // Add getter/setter
    Object.defineProperty(data, propName, {
      get: function() {
        // Property Cache
        let cache;

        if(observer.cache[propName] === undefined) {
          // Capture dependencies
          observer.target = propName;

          // Invoke getter
          cache = getter.call(instance);

          // Stop capturing dependencies
          observer.target = undefined;

          // Store value in cache
          observer.cache[propName] = cache;
        } else {
          // Use cached value
          cache = observer.cache[propName];
        }

        return cache;
      },
      set: setter === undefined ? noop : function(val) {
        setter.call(instance, val);
      }
    });
  }
}
