/**
 * Converts attributes into key-value pairs
 * @param {Node} node
 * @return {Object} Key-Value pairs of Attributes
 */
const extractAttrs = function(node) {
  let attrs = {};
  for(var rawAttrs = node.attributes, i = rawAttrs.length; i--;) {
    attrs[rawAttrs[i].name] = rawAttrs[i].value;
  }
  return attrs;
}


/**
 * Adds An Event Handler to a Type of Listener
 * @param {Object} node
 * @param {String} type
 * @param {Object} eventListeners
 */
const addEventHandler = function(node, type, eventListeners) {
  // Create handle function
  const handle = function(evt) {
    const handlers = handle.handlers;
    for(let i = 0; i < handlers.length; i++) {
      handlers[i](evt);
    }
  }

  // Add handlers to handle
  handle.handlers = eventListeners[type];

  // Add handler to vnode
  eventListeners[type] = handle;

  // Add event listener
  node.addEventListener(type, handle);
}

const addEventListeners = function(node, eventListeners) {
  for(let type in eventListeners) {
    addEventHandler(node, type, eventListeners);
  }
}

/**
 * Creates DOM Node from VNode
 * @param {Object} vnode
 * @return {Object} DOM Node
 */
const createNodeFromVNode = function(vnode) {
  const type = vnode.type;
  let meta = vnode.meta;
  let el = null;

  if(type === "#text") {
    // Create textnode
    el = document.createTextNode(vnode.val);
  } else {
    let children = vnode.children;
    el = meta.isSVG ? document.createElementNS("http://www.w3.org/2000/svg", type) : document.createElement(type);

    // Optimization: VNode only has one child that is text, and create it here
    let firstChild = children[0];
    if(children.length === 1 && firstChild.type === "#text") {
      el.textContent = firstChild.val;
      firstChild.meta.el = el.firstChild;
    } else {
      // Add all children
      for(let i = 0; i < children.length; i++) {
        const vchild = children[i];
        appendChild(createNodeFromVNode(vchild), vchild, el);
      }
    }
    // Add all event listeners
    let eventListeners = null;
    if((eventListeners = meta.eventListeners) !== undefined) {
      addEventListeners(el, eventListeners);
    }
  }

  // Setup Props
  diffProps(el, {}, vnode, vnode.props);

  // Hydrate
  vnode.meta.el = el;

  return el;
}

/**
 * Appends a Child, Ensuring Components are Mounted
 * @param {Object} node
 * @param {Object} vnode
 * @param {Object} parent
 */
const appendChild = function(node, vnode, parent) {
  // Remove the node
  parent.appendChild(node);

  // Check for Component
  let component = null;
  if((component = vnode.meta.component) !== undefined) {
    createComponentFromVNode(node, vnode, component);
  }
}

/**
 * Removes a Child, Ensuring Components are Unmounted
 * @param {Object} node
 * @param {Object} parent
 */
const removeChild = function(node, parent) {
  // Check for Component
  let componentInstance = null;
  if((componentInstance = node.__moon__) !== undefined) {
    // Component was unmounted, destroy it here
    componentInstance.destroy();
  }

  // Remove the Node
  parent.removeChild(node);
}

/**
 * Replaces a Child, Ensuring Components are Unmounted/Mounted
 * @param {Object} oldNode
 * @param {Object} newNode
 * @param {Object} vnode
 * @param {Object} parent
 */
const replaceChild = function(oldNode, newNode, vnode, parent) {
  // Check for Component
  let componentInstance = null;
  if((componentInstance = oldNode.__moon__) !== undefined) {
    // Component was unmounted, destroy it here
    componentInstance.destroy();
  }

  // Replace It
  parent.replaceChild(newNode, oldNode);

  // Check for Component
  let component = null;
  if((component = vnode.meta.component) !== undefined) {
    createComponentFromVNode(newNode, vnode, component);
  }
}
