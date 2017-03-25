/* ======= Instance Methods ======= */

/**
 * Gets Value in Data
 * @param {String} key
 * @return {String} Value of key in data
 */
Moon.prototype.get = function(key) {
  if(this.$observer.dep.target) {
    if(!this.$observer.dep.map[key]) {
      this.$observer.dep.map[key] = [];
    }
    this.$observer.dep.map[key].push(this.$observer.dep.target);
  }
  return this.$data[key];
}

/**
 * Sets Value in Data
 * @param {String} key
 * @param {String} val
 */
Moon.prototype.set = function(key, val) {
  const base = resolveKeyPath(this, this.$data, key, val);
  this.$observer.notify(base);
  queueBuild(this);
}

/**
 * Destroys Moon Instance
 */
Moon.prototype.destroy = function() {
  this.removeEvents();
  this.$el = null;
  this.$destroyed = true;
  callHook(this, 'destroyed');
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
  const index = this.$events[eventName].indexOf(action);
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
  for(let evt in this.$events) {
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
    for(let i = 0; i < this.$events["*"].length; i++) {
      this.$events["*"][i](meta);
    }
  }

  for(let i = 0; i < this.$events[eventName].length; i++) {
    this.$events[eventName][i](meta);
  }
}

/**
 * Renders "m-for" Directive Array
 * @param {Array} arr
 * @param {Function} item
 */
Moon.prototype.renderLoop = function(arr, item) {
  let items = [];
  for(let i = 0; i < arr.length; i++) {
    items.push(item(arr[i], i));
  }
  return items;
}

/**
 * Renders a Class in Array/Object Form
 * @param {Array|Object|String} classNames
 * @return {String} renderedClassNames
 */
Moon.prototype.renderClass = function(classNames) {
  if(typeof classNames === "string") {
    return classNames;
  }
  let renderedClassNames = "";
  if(Array.isArray(classNames)) {
    for(let i = 0; i < classNames.length; i++) {
      renderedClassNames += `${this.renderClass(classNames[i])} `;
    }
  } else if(typeof classNames === "object") {
    for(let className in classNames) {
      if(classNames[className]) {
        renderedClassNames += `${className} `;
      }
    }
  }
  renderedClassNames = renderedClassNames.slice(0, -1);
  return renderedClassNames;
}

/**
 * Mounts Moon Element
 * @param {Object} el
 */
Moon.prototype.mount = function(el) {
  this.$el = document.querySelector(el);
  this.$destroyed = false;

  if("__ENV__" !== "production" && !this.$el) {
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
  const newRootEl = diff(node, vnode, parent, this);
  if(node !== newRootEl) {
    // Root Node Changed, Apply Change in Instance
    this.$el = newRootEl;
    this.$el.__moon__ = this;
  }
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
  callHook(this, 'init');

  if(this.$opts.el) {
    this.mount(this.$opts.el);
  }
}
