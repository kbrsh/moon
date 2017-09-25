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

Moon.prototype.destroy = function() {
  // Remove event listeners
  this.off();

  // Remove reference to element
  this.root = undefined;

  // Queue
  this.queued = true;

  // Call destroyed hook
  callHook(this, "destroyed");
}

// Event Emitter, adapted from https://github.com/kbrsh/voke

Moon.prototype.on = function(eventType, handler) {
  let events = this.events;
  let handlers = events[eventType];

  if(handlers === undefined) {
    // Create handler
    events[eventType] = [handler];
  } else {
    // Add handler
    handlers.push(handler);
  }
}

Moon.prototype.off = function(eventType, handler) {
  if(eventType === undefined) {
    // No event name provided, remove all events
    this.events = {};
  } else if(handler === undefined) {
    // No handler provided, remove all handlers for the event name
    this.events[eventType] = [];
  } else {
    // Get handlers from event name
    let handlers = this.events[eventType];

    // Get index of the handler to remove
    const index = handlers.indexOf(handler);

    // Remove the handler
    handlers.splice(index, 1);
  }
}

Moon.prototype.emit = function(eventType, data) {
  // Events
  const events = this.events;

  // Get handlers and global handlers
  let handlers = events[eventType];
  let globalHandlers = events['*'];

  // Counter
  let i;

  // Call all handlers for the event name
  if(handlers !== undefined) {
    for(i = 0; i < handlers.length; i++) {
      handlers[i](data);
    }
  }

  if(globalHandlers !== undefined) {
    // Call all of the global handlers if present
    for(i = 0; i < globalHandlers.length; i++) {
      globalHandlers[i](eventType, data);
    }
  }
}

Moon.prototype.mount = function(rootOption) {
  // Get root from the DOM
  let root = this.root = typeof rootOption === "string" ? document.querySelector(rootOption) : rootOption;
  if("__ENV__" !== "production" && root === null) {
    error("Element " + this.options.root + " not found");
  }

  // Setup template as provided `template` or outerHTML of the node
  defineProperty(this, "template", this.options.template, root.outerHTML);

  // Setup render Function
  if(this.compiledRender === noop) {
    this.compiledRender = Moon.compile(this.template);
  }

  // Remove queued state
  this.queued = false;

  // Hydrate
  const dom = this.render();
  if(root.nodeName.toLowerCase() === dom.type) {
    hydrate(root, dom);
  } else {
    const newRoot = createNode(dom);
    root.parentNode.replaceChild(newRoot, root);
    this.root = newRoot;
  }

  this.dom = dom;

  // Call mounted hook
  callHook(this, "mounted");
}

Moon.prototype.render = function() {
  return this.compiledRender(m);
}

Moon.prototype.build = function() {
  const dom = this.render();
  let old = this.dom;

  if(dom !== old) {
    patch(dom, old);
  }
}

Moon.prototype.init = function() {
  log("======= Moon =======");
  callHook(this, "init");

  const root = this.options.root;
  if(root !== undefined) {
    this.mount(root);
  }
}
