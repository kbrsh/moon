/* ======= Instance Methods ======= */

/**
 * Logs a Message
 * @param {String} msg
 */
Moon.prototype.log = function(msg) {
  if(!Moon.config.silent) console.log(msg);
}

/**
 * Throws an Error
 * @param {String} msg
 */
Moon.prototype.error = function(msg) {
  console.error("[Moon] ERR: " + msg);
}

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
  if(!this.$destroyed) this.build();
  this.$hooks.updated();
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
 * @param {Node} el
 */
Moon.prototype.mount = function(el) {
  this.$el = document.querySelector(el);

  if(!this.$el) {
    this.error("Element " + this.$opts.el + " not found");
  }

  this.$template = this.$opts.template || this.$el.innerHTML;

  setInitialElementValue(this.$el, this.$template);

  if(this.$opts.render) {
    this.$dom = this.$render(h);
  } else {
    createVirtualDOM(this.$el, this.$dom, this.$nodes);
  }

  this.build();
  this.$hooks.mounted();
}

/**
 * Renders Virtual DOM
 * @return Virtual DOM
 */
Moon.prototype.render = function() {
  if(this.$opts.render) {
    return this.$render(h);
  } else {
    return renderVirtualDOM(this.$dom, this.$data);
  }
}

/**
 * Render and Builds the DOM With Data
 * @param {Array} vdom
 */
Moon.prototype.build = function() {
  this.$dom = this.render();
  this.buildNodes(this.$dom, this.$el);
}

/**
 * Builds Nodes With Data
 * @param {Array} vdom
 * @param {Array} nodes
 * @param {Node} parent
 */
Moon.prototype.buildNodes = function(vdom, nodes, parent) {
  for(var i = 0; i < vdom.children.length; i++) {
    var vnode = vdom.children[i];
    // If no node, create one
    if(!vnode.node) {
      var node;
      if(vnode.type === "#text") {
        node = document.createTextNode(vnode.val);
      } else {
        node = document.createElement(vnode.type);
        node.textContent = vnode.textContent;
      }
      parent.appendChild(node);
    }
    // Check if Moon should render this VNode
    if(vnode.meta.shouldRender) {
      // If it is a text node, render it
      if(vnode.type === "#text") {
        vnode.node.textContent = vnode.compiled;
      // If it is a different node, render the props
      } else if(vnode.props) {
        // Compile the properties
        for(var attr in vnode.compiledProps) {
          var compiledProp = vnode.compiledProps[attr];
          if(directives[attr]) {
            vnode.node.removeAttribute(attr);
            directives[attr](vnode.node, compiledProp, vnode);
          } else {
            vnode.node.setAttribute(attr, compiledProp);
          }
        }
      }

      this.buildNodes(vnode, parent);
    }
  }
}

/**
 * Initializes Moon
 */
Moon.prototype.init = function() {
  this.log("======= Moon =======");
  this.$hooks.created();

  if(this.$opts.el) {
    this.mount(this.$opts.el);
  }
}
