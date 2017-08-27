function Observer(instance) {
  // Associated Moon Instance
  this.instance = instance;

  // Computed Property Cache
  this.cache = {};

  // Set of events to clear cache when dependencies change
  this.clear = {};

  // Property Currently Being Observed for Dependencies
  this.target = undefined;

  // Dependency Map
  this.map = {};
}

Observer.prototype.observe = function(key) {
  const self = this;
  this.clear[key] = function() {
    self.cache[key] = undefined;
  }
}

Observer.prototype.notify = function(key) {
  const self = this;

  let depMap = this.map[key];
  if(depMap !== undefined) {
    for(let i = 0; i < depMap.length; i++) {
      self.notify(depMap[i]);
    }
  }

  let clear = this.clear[key];
  if(clear !== undefined) {
    clear();
  }
}
