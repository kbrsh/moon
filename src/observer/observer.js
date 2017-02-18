function Observer(instance) {
  this.instance = instance;
}

Observer.prototype.notify = function() {
  queueBuild(this.instance);
}
