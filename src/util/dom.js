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
 * Adds metadata Event Listeners to an Element
 * @param {Object} node
 * @param {Object} eventListeners
 */
const addEventListeners = function(node, eventListeners) {
  const addHandler = function(type) {
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

  for(let type in eventListeners) {
    addHandler(type);
  }
}

/**
 * Creates DOM Node from VNode
 * @param {Object} vnode
 * @return {Object} DOM Node
 */
const createNodeFromVNode = function(vnode) {
  let el = null;

  if(vnode.type === "#text") {
    // Create textnode
    el = document.createTextNode(vnode.val);
  } else {
    el = vnode.meta.isSVG ? document.createElementNS("http://www.w3.org/2000/svg", vnode.type) : document.createElement(vnode.type);
    // Optimization: VNode only has one child that is text, and create it here
    if(vnode.children.length === 1 && vnode.children[0].type === "#text") {
      el.textContent = vnode.children[0].val;
      vnode.children[0].meta.el = el.firstChild;
    } else {
      // Add all children
      for(var i = 0; i < vnode.children.length; i++) {
        const vchild = vnode.children[i];
        appendChild(createNodeFromVNode(vchild), vchild, el);
      }
    }
    // Add all event listeners
    let eventListeners = null;
    if((eventListeners = vnode.meta.eventListeners) !== undefined) {
      addEventListeners(el, eventListeners);
    }
  }

  // Setup Props
  diffProps(el, {}, vnode, vnode.props.attrs);

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
