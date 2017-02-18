function Watcher(instance) {
  this.instance = instance;
}

Watcher.prototype.notify = function() {
  queueBuild(this.instance);
}
