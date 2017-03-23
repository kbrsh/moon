function Observer(instance) {
  this.instance = instance;
  this.cache = {};
}

Observer.prototype.notify = function() {
  queueBuild(this.instance);
}
