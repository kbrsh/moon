function Observer(instance) {
  this.instance = instance;
  this.cache = {};
}

Observer.prototype.getComputed = function(prop) {
  // Check if Changed ("dirty")
  if(this.cache[prop].dirty) {
    // Invoke Getter
    var output = this.cache[prop].getter.call(this.instance);

    // Cache Output
    this.cache[prop].cache = output;

    // Return Output
    return output;
  } else {
    // Clean, return Cached Value
    return this.cache[prop].cache;
  }
}

Observer.prototype.notify = function() {
  queueBuild(this.instance);
}
