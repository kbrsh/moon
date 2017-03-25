function Observer(instance) {
  this.instance = instance;
  this.cache = {};
  this.signals = {};
  this.dep = {
    target: null,
    map: {}
  };
}

Observer.prototype.observe = function(key) {
  let self = this;
  this.signals[key] = function() {
    self.cache[key] = null;
  }
}

Observer.prototype.notify = function(key) {
  if(this.dep.map[key]) {
    for(let i = 0; i < this.dep.map[key].length; i++) {
      this.notify(this.dep.map[key][i]);
    }
  }

  if(!this.signals[key]) {
    return;
  }

  this.signals[key]();
}
