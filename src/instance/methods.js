/* ======= Instance Methods ======= */

/**
 * Gets Value in Data
 * @param {String} key
 * @return {String} Value of key in data
 */
Moon.prototype.get = function(key) {
  return this.$data[key];
}

/**
 * Sets Value in Data
 * @param {String} key
 * @param {String} val
 */
Moon.prototype.set = function(key, val) {
  this.$data[key] = val;
  if(!this.$queued && !this.$destroyed) {
    this.$queued = true;
    setTimeout(function() {
      self.build();
      self.$hooks.updated();
      this.$queued = false;
    }, 0);
  }
}

/**
 * Destroys Moon Instance
 */
Moon.prototype.destroy = function() {
  Object.defineProperty(this, '$data', {
    set: function(value) {
      _data = value;
    }
  });
  this.removeEvents();
  this.$destroyed = true;
  this.$hooks.destroyed();
}

/**
 * Calls a method
 * @param {String} method
 */
Moon.prototype.callMethod = function(method, args) {
  args = args || [];
  this.$methods[method].apply(this, args);
}

// Event Emitter, adapted from https://github.com/KingPixil/voke

/**
 * Attaches an Event Listener
 * @param {String} eventName
 * @param {Function} action
 */
Moon.prototype.on = function(eventName, action) {
  if(this.$events[eventName]) {
    this.$events[eventName].push(action);
  } else {
    this.$events[eventName] = [action];
  }
}

/**
 * Removes an Event Listener
 * @param {String} eventName
 * @param {Function} action
 */
Moon.prototype.off = function(eventName, action) {
  var index = this.$events[eventName].indexOf(action);
  if(index !== -1) {
    this.$events[eventName].splice(index, 1);
  }
}

/**
 * Removes All Event Listeners
 * @param {String} eventName
 * @param {Function} action
 */
Moon.prototype.removeEvents = function() {
  for(var evt in this.$events) {
    this.$events[evt] = [];
  }
}

/**
 * Emits an Event
 * @param {String} eventName
 * @param {Object} meta
 */
Moon.prototype.emit = function(eventName, meta) {
  meta = meta || {};
  meta.type = eventName;

  if(this.$events["*"]) {
    for(var i = 0; i < this.$events["*"].length; i++) {
      var globalHandler = this.$events["*"][i];
      globalHandler(meta);
    }
  }

  for(var i = 0; i < this.$events[eventName].length; i++) {
    var handler = this.$events[eventName][i];
    handler(meta);
  }
}

/**
 * Mounts Moon Element
 * @param {Object} el
 */
Moon.prototype.mount = function(el) {
  this.$el = document.querySelector(el);

  if(!this.$el) {
    error("Element " + this.$opts.el + " not found");
  }

  this.$template = this.$opts.template || this.$el.outerHTML;

  this.$el.outerHTML = this.$template;

  if(this.$render === noop) {
    this.$render = Moon.compile(this.$template);
  }

  this.build();
  this.$hooks.mounted();
}

/**
 * Renders Virtual DOM
 * @return Virtual DOM
 */
Moon.prototype.render = function() {
  return this.$render(h);
}

/**
 * Diff then Patches Nodes With Data
 * @param {Object} node
 * @param {Object} vnode
 */
Moon.prototype.patch = function(node, vnode, parent) {
  diff(node, vnode, parent);
}

/**
 * Render and Patches the DOM With Data
 */
Moon.prototype.build = function() {
  this.$dom = this.render();
  this.patch(this.$el, this.$dom, this.$el);
}

/**
 * Initializes Moon
 */
Moon.prototype.init = function() {
  log("======= Moon =======");
  this.$hooks.created();

  if(this.$opts.el) {
    this.mount(this.$opts.el);
  }
}
