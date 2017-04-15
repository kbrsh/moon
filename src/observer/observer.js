function Observer(instance) {
  this.instance = instance;
  this.cache = {};
  this.clear = {};
  this.dep = {
    target: null,
    map: {}
  };
}

Observer.prototype.observe = function(key) {
  let self = this;
  this.clear[key] = function() {
    self.cache[key] = null;
  }
}

Observer.prototype.notify = function(key) {
  let depMap = null;
  if((depMap = this.dep.map[key]) !== undefined) {
    for(let i = 0; i < this.dep.map[key].length; i++) {
      this.notify(this.dep.map[key][i]);
    }
  }

  let clear = null;
  if((clear = this.clear[key]) !== undefined) {
    clear();
  }
}
