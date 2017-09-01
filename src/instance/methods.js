/* ======= Instance Methods ======= */

/**
 * Gets Value in Data
 * @param {String} key
 * @return {String} Value of key in data
 */
Moon.prototype.get = function(key) {
  // Collect dependencies if currently collecting
  const observer = this.observer;
  let map = observer.map;
  let target = observer.target;

  if(target !== undefined) {
    if(map[key] === undefined) {
      map[key] = [target];
    } else if(map[key].indexOf(target) === -1) {
      map[key].push(target);
    }
  }

  // Return value
  if("__ENV__" !== "production" && this.data.hasOwnProperty(key) === false) {
    error(`The item "${key}" was referenced but not defined`);
  }
  return this.data[key];
}

/**
 * Sets Value in Data
 * @param {String|Object} key
 * @param {Any} value
 */
Moon.prototype.set = function(key, value) {
  // Get observer
  const observer = this.observer;

  if(typeof key === "object") {
    // Shallow merge
    let data = this.data;
    for(let prop in key) {
      // Set value
      data[prop] = key[prop];

      // Notify observer of change
      observer.notify(prop);
    }
  } else {
    // Set value
    this.data[key] = value;

    // Notify observer of change
    observer.notify(key);
  }

  // Queue a build
  queueBuild(this);
}

/**
 * Destroys Moon Instance
 */
Moon.prototype.destroy = function() {
  // Remove event listeners
  this.off();

  // Remove reference to element
  delete this.root.__moon__;
  this.root = undefined;

  // Queue
  this.queued = true;

  // Call destroyed hook
  callHook(this, "destroyed");
}

/**
 * Calls a method
 * @param {String} method
 * @return {Any} output of method
 */
Moon.prototype.callMethod = function(method, args) {
  // Get arguments
  args = args || [];

  // Call method in context of instance
  return this.data[method].apply(this, args);
}

// Event Emitter, adapted from https://github.com/kbrsh/voke

/**
 * Attaches an Event Listener
 * @param {String} eventName
 * @param {Function} handler
 */
Moon.prototype.on = function(eventName, handler) {
  // Get list of handlers
  let handlers = this.events[eventName];

  if(handlers === undefined) {
    // If no handlers, create them
    this.events[eventName] = [handler];
  } else {
    // If there are already handlers, add it to the list of them
    handlers.push(handler);
  }
}

/**
 * Removes an Event Listener
 * @param {String} eventName
 * @param {Function} handler
 */
Moon.prototype.off = function(eventName, handler) {
  if(eventName === undefined) {
    // No event name provided, remove all events
    this.events = {};
  } else if(handler === undefined) {
    // No handler provided, remove all handlers for the event name
    this.events[eventName] = [];
  } else {
    // Get handlers from event name
    let handlers = this.events[eventName];

    // Get index of the handler to remove
    const index = handlers.indexOf(handler);

    // Remove the handler
    handlers.splice(index, 1);
  }
}

/**
 * Emits an Event
 * @param {String} eventName
 * @param {Object} customMeta
 */
Moon.prototype.emit = function(eventName, customMeta) {
  // Setup metadata to pass to event
  let meta = customMeta || {};
  meta.type = eventName;

  // Get handlers and global handlers
  let handlers = [].concat(this.events[eventName]);
  let globalHandlers = this.events['*'];

  // Counter
  let i = 0;

  // Call all handlers for the event name
  if(handlers !== undefined) {
    for(i = 0; i < handlers.length; i++) {
      handlers[i](meta);
    }
  }

  if(globalHandlers !== undefined) {
    // Call all of the global handlers if present
    for(i = 0; i < globalHandlers.length; i++) {
      globalHandlers[i](meta);
    }
  }
}

/**
 * Mounts Moon Element
 * @param {String|Object} root
 */
Moon.prototype.mount = function(root) {
  // Get element from the DOM
  this.root = typeof root === "string" ? document.querySelector(root) : root;

  if("__ENV__" !== "production" && this.root === null) {
    // Element not found
    error("Element " + this.options.root + " not found");
  }

  // Sync Element and Moon instance
  this.root.__moon__ = this;

  // Setup template as provided `template` or outerHTML of the Element
  defineProperty(this, "template", this.options.template, this.root.outerHTML);

  // Setup render Function
  if(this.compiledRender === noop) {
    this.compiledRender = Moon.compile(this.template);
  }

  // Remove queued state
  this.queued = false;

  // Run First Build
  this.build();

  // Call mounted hook
  callHook(this, "mounted");
}

/**
 * Renders Virtual DOM
 * @return {Object} Virtual DOM
 */
Moon.prototype.render = function() {
  // Call render function
  return this.compiledRender(m);
}

/**
 * Diff then Patches Nodes With Data
 * @param {Object} old
 * @param {Object} vnode
 * @param {Object} parent
 */
Moon.prototype.patch = function(old, vnode, parent) {
  if(old.meta !== undefined) {
    // If it is a VNode, then diff
    if(vnode.type !== old.type) {
      // Root element changed during diff
      const oldRoot = old.meta.node;

      // Replace root element
      const newRoot = createNodeFromVNode(vnode);
      parent.replaceChild(newRoot, oldRoot);

      // Update Bound Instance
      newRoot.__moon__ = this;
      this.root = newRoot;
    } else {
      // Diff
      diff(old, vnode, 0, parent, {});
    }

  } else if(old instanceof Node) {
    // Hydrate
    if(old.nodeName.toLowerCase() !== vnode.type) {
      // Root element changed, replace it
      const newRoot = createNodeFromVNode(vnode);
      parent.replaceChild(newRoot, old);

      // Update bound instance
      newRoot.__moon__ = this;
      this.root = newRoot;
    } else {
      hydrate(old, vnode, parent);
    }
  }
}

/**
 * Render and Patches the DOM With Data
 */
Moon.prototype.build = function() {
  // Get new virtual DOM
  const dom = this.render();

  // Old item to patch
  let old;

  if(this.dom.meta !== undefined) {
    // If old virtual dom exists, patch against it
    old = this.dom;
  } else {
    // No virtual DOM, patch with actual DOM element, and setup virtual DOM
    old = this.root;
    this.dom = dom;
  }

  // Patch old and new
  this.patch(old, dom, this.root.parentNode);
}

/**
 * Initializes Moon
 */
Moon.prototype.init = function() {
  log("======= Moon =======");
  callHook(this, "init");

  const root = this.options.root;
  if(root !== undefined) {
    this.mount(root);
  }
}
