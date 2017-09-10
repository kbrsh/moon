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

// Event Emitter, adapted from https://github.com/kbrsh/voke

/**
 * Attaches an Event Listener
 * @param {String} eventName
 * @param {Function} handler
 */
Moon.prototype.on = function(eventName, handler) {
  let events = this.events;
  let handlers = events[eventName];

  if(handlers === undefined) {
    // Create handler
    events[eventName] = [handler];
  } else {
    // Add handler
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
  // Events
  const events = this.events;

  // Setup metadata to pass to event
  let meta = {};
  if(customMeta !== undefined) {
    meta = customMeta;
  }

  meta.type = eventName;

  // Get handlers and global handlers
  let handlers = events[eventName];
  let globalHandlers = events['*'];

  // Counter
  let i;

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
Moon.prototype.mount = function(rootOption) {
  // Get element from the DOM
  let root = this.root = typeof rootOption === "string" ? document.querySelector(rootOption) : rootOption;
  if("__ENV__" !== "production" && root === null) {
    // Element not found
    error("Element " + this.options.root + " not found");
  }

  // Sync Element and Moon instance
  root.__moon__ = this;

  // Setup template as provided `template` or outerHTML of the node
  defineProperty(this, "template", this.options.template, root.outerHTML);

  // Setup render Function
  if(this.compiledRender === noop) {
    this.compiledRender = Moon.compile(this.template);
  }

  // Remove queued state
  this.queued = false;

  // Build
  this.build();

  // Call mounted hook
  callHook(this, "mounted");
}

/**
 * Renders Virtual DOM
 * @return {Object} Virtual DOM
 */
Moon.prototype.render = function() {
  return this.compiledRender(m);
}

/**
 * Renders and Patches the DOM
 */
Moon.prototype.build = function() {
  const root = this.root;
  const dom = this.render();
  let old = this.dom;

  if(old.meta === undefined) {
    // Hydrate
    if(root.nodeName.toLowerCase() === dom.type) {
      hydrate(root, dom, root.parentNode);
    } else {
      const newRoot = createNode(dom);
      root.parentNode.replaceChild(newRoot, root);

      newRoot.__moon__ = this;
      this.root = newRoot;
    }

    this.dom = dom;
  } else {
    // Diff
    if(dom.type === old.type) {
      diff(old, dom, 0, root.parentNode, {});
    } else {
      const newRoot = createNode(dom);
      root.parentNode.replaceChild(newRoot, root);

      newRoot.__moon__ = this;
      this.root = newRoot;
    }
  }
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
