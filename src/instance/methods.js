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
  var self = this;
  this.$data[key] = val;
  if(!this.$queued && !this.$destroyed) {
    this.$queued = true;
    setTimeout(function() {
      self.build();
      callHook(self, 'updated');
      self.$queued = false;
    }, 0);
  }
}

/**
 * Destroys Moon Instance
 */
Moon.prototype.destroy = function() {
  this.removeEvents();
  this.$destroyed = true;
  callHook(this, 'destroyed');
}

/**
 * Calls a method
 * @param {String} method
 */
Moon.prototype.callMethod = function(method, args) {
  args = args || [];
  var full = method.split("(");
  var customParams;
  if(full[1]) {
    method = full[0];
    customParams = full[1].slice(0, -1);
    var paramsToArr = new Function(`return [${customParams}]`);
    customParams = paramsToArr();
    args = args.concat(customParams);
  }
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
 * Renders "m-for" Directive Array
 * @param {Array} arr
 * @param {Function} item
 */
Moon.prototype.renderLoop = function(arr, item) {
  var items = [];
  for(var i = 0; i < arr.length; i++) {
    items.push(item(arr[i], i));
  }
  return items;
}

/**
 * Mounts Moon Element
 * @param {Object} el
 */
Moon.prototype.mount = function(el) {
  this.$el = document.querySelector(el);
  this.$destroyed = false;

  if(!this.$el) {
    error("Element " + this.$opts.el + " not found");
  }

  // Sync Element and Moon instance
  this.$el.__moon__ = this;

  // Setup template as provided `template` or outerHTML of the Element
  this.$template = this.$opts.template || this.$el.outerHTML;

  // Setup render Function
  if(this.$render === noop) {
    this.$render = Moon.compile(this.$template);
  }

  // Run First Build
  this.build();
  callHook(this, 'mounted');
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
  diff(node, vnode, parent, this);
  this.$initialRender = false;
}

/**
 * Render and Patches the DOM With Data
 */
Moon.prototype.build = function() {
  this.$dom = this.render();
  this.patch(this.$el, this.$dom, this.$el.parentNode);
}

/**
 * Initializes Moon
 */
Moon.prototype.init = function() {
  log("======= Moon =======");
  callHook(this, 'created');

  if(this.$opts.el) {
    this.mount(this.$opts.el);
  }
}
