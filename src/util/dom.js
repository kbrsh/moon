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
  let node;

  if(type === "#text") {
    // Create textnode
    node = document.createTextNode(vnode.value);
  } else {
    let children = vnode.children;
    node = meta.isSVG === 1 ? document.createElementNS("http://www.w3.org/2000/svg", type) : document.createElement(type);

    // Optimization: VNode only has one child that is text, and create it here
    let firstChild = children[0];
    if(children.length === 1 && firstChild.type === "#text") {
      node.textContent = firstChild.value;
      firstChild.meta.node = node.firstChild;
    } else {
      // Add all children
      for(let i = 0; i < children.length; i++) {
        const vchild = children[i];
        appendChild(createNodeFromVNode(vchild), vchild, node);
      }
    }

    // Add all event listeners
    let eventListeners = meta.eventListeners;
    if(eventListeners !== undefined) {
      addEventListeners(node, eventListeners);
    }

    // Setup Props
    diffProps(node, {}, vnode, vnode.props);
  }

  // Hydrate
  vnode.meta.node = node;

  return node;
}

/**
 * Appends a Child, Ensuring Components are Mounted
 * @param {Object} node
 * @param {Object} vnode
 * @param {Object} parent
 */
const appendChild = function(node, vnode, parent) {
  // Append the node
  parent.appendChild(node);

  // Check for Component
  let component = vnode.meta.component;
  if(component !== undefined) {
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
  let componentInstance = node.__moon__;
  if(componentInstance !== undefined) {
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
  let componentInstance = oldNode.__moon__;
  if(componentInstance !== undefined) {
    // Component was unmounted, destroy it here
    componentInstance.destroy();
  }

  // Replace the node
  parent.replaceChild(newNode, oldNode);

  // Check for Component
  let component = vnode.meta.component;
  if(component !== undefined) {
    createComponentFromVNode(newNode, vnode, component);
  }
}
