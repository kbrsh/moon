export function Observer() {
  // Property currently being observed
  this.target = undefined;
  
  // Computed property cache
  this.cache = {};

  // Dependency Map
  this.map = {};
}

Observer.prototype.notify = function(key) {
  // Notify all dependent keys
  let map = this.map[key];
  if(map !== undefined) {
    for(let i = 0; i < map.length; i++) {
      this.notify(map[i]);
    }
  }

  // Clear cache for key
  let cache = this.cache;
  if(cache[key] !== undefined) {
    cache[key] = undefined;
  }
}
