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
const createNode = function(vnode) {
  const type = vnode.type;
  let meta = vnode.meta;
  let node;

  if(type === "#text") {
    // Create textnode
    node = document.createTextNode(vnode.value);
  } else {
    let children = vnode.children;
    node = meta.isSVG === 1 ? document.createElementNS("http://www.w3.org/2000/svg", type) : document.createElement(type);

    // Add all children
    for(let i = 0; i < children.length; i++) {
      const vchild = children[i];
      appendChild(vchild, node);
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
 * @param {Object} vnode
 * @param {Object} parent
 */
const appendChild = function(vnode, parent) {
  // New Component
  let component = vnode.meta.component;

  if(component === undefined) {
    // Create node
    const node = createNode(vnode);

    // Append node
    parent.appendChild(node);
  } else {
    // Create node
    const node = document.createElement(vnode.type);

    // Append node
    parent.appendChild(node);

    // Create Component
    createComponent(node, vnode, component);
  }
}

/**
 * Removes a Child, Ensuring Components are Unmounted
 * @param {Object} node
 * @param {Object} parent
 */
const removeChild = function(node, parent) {
  // Check for Existing Component
  let componentInstance = node.__moon__;
  if(componentInstance !== undefined) {
    // Destroy existing component
    componentInstance.destroy();
  }

  // Remove the Node
  parent.removeChild(node);
}

/**
 * Replaces a Child, Ensuring Components are Unmounted/Mounted
 * @param {Object} node
 * @param {Object} vnode
 * @param {Object} parent
 */
const replaceChild = function(node, vnode, parent) {
  // Check for Existing Component
  let componentInstance = node.__moon__;
  if(componentInstance !== undefined) {
    // Destroy existing component
    componentInstance.destroy();
  }

  // New Component
  let component = vnode.meta.component;
  if(component === undefined) {
    // Create node
    const newNode = createNode(vnode);

    // Replace the node
    parent.replaceChild(newNode, node);
  } else {
    createComponent(node, vnode, component);
  }
}
