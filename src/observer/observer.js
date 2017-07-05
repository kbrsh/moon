function Observer(instance) {
  // Associated Moon Instance
  this.instance = instance;

  // Computed Property Cache
  this.cache = {};

  // Computed Property Setters
  this.setters = {};

  // Set of events to clear cache when dependencies change
  this.clear = {};

  // Property Currently Being Observed for Dependencies
  this.target = null;

  // Dependency Map
  this.map = {};
}

Observer.prototype.observe = function(key) {
  const self = this;
  this.clear[key] = function() {
    self.cache[key] = undefined;
  }
}

Observer.prototype.notify = function(key, val) {
  const self = this;

  let depMap = null;
  if((depMap = this.map[key]) !== undefined) {
    for(let i = 0; i < depMap.length; i++) {
      self.notify(depMap[i]);
    }
  }

  let clear = null;
  if((clear = this.clear[key]) !== undefined) {
    clear();
  }
}
