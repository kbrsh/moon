function Observer(instance) {
  this.instance = instance;
  this.cache = {};
  this.dep = {
    target: null,
    map: {},
    changed: {}
  };
}

Observer.prototype.notify = function(key) {
  this.dep.changed[key] = true;
  queueBuild(this.instance);
}
