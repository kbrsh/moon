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
 * @param {Object} vnode
 * @param {Object} instance
 */
const addEventListeners = function(node, vnode, instance) {
  const eventListeners = vnode.meta.eventListeners;
  for(let type in eventListeners) {
    for(let i = 0; i < eventListeners[type].length; i++) {
      const method = eventListeners[type][i];
      node.addEventListener(type, method);
    }
  }
}

/**
 * Creates DOM Node from VNode
 * @param {Object} vnode
 * @param {Object} instance
 * @return {Object} DOM Node
 */
const createNodeFromVNode = function(vnode, instance) {
  let el = null;

  if(vnode.type === "#text") {
    // Create textnode
    el = document.createTextNode(vnode.val);
  } else {
    el = vnode.meta.isSVG ? document.createElementNS('http://www.w3.org/2000/svg', vnode.type) : document.createElement(vnode.type);
    // Optimization: VNode only has one child that is text, and create it here
    if(vnode.children.length === 1 && vnode.children[0].type === "#text") {
      el.textContent = vnode.children[0].val;
      vnode.children[0].meta.el = el.firstChild;
    } else {
      // Add all children
      for(var i = 0; i < vnode.children.length; i++) {
        let childVNode = vnode.children[i];
        let childNode = createNodeFromVNode(vnode.children[i], instance);
        el.appendChild(childNode);
        // Component detected, mount it here
        if(childVNode.meta.component) {
          createComponentFromVNode(childNode, childVNode, childVNode.meta.component);
        }
      }
    }
    // Add all event listeners
    addEventListeners(el, vnode, instance);
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
  if(vnode.meta.component) {
    createComponentFromVNode(node, vnode, vnode.meta.component);
  }
}

/**
 * Removes a Child, Ensuring Components are Unmounted
 * @param {Object} node
 * @param {Object} oldVNode
 * @param {Object} parent
 */
const removeChild = function(node, oldVNode, parent) {
  // Check for Component
  if(node.__moon__) {
    // Component was unmounted, destroy it here
    node.__moon__.destroy();
  }

  if(oldVNode && oldVNode.meta.transition) {
    // Remove the Node after Exit Transition
    const exitTransitionClassName = `${oldVNode.meta.transition}-transition-exit`;
    const exitTransitionEvent = function() {
      node.removeEventListener(transitionEndEvent, exitTransitionEvent);
      parent.removeChild(node);
    }
    node.addEventListener(transitionEndEvent, exitTransitionEvent);
    node.classList.add(exitTransitionClassName);
  } else {
    // Remove the Node
    parent.removeChild(node);
  }
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
  if(oldNode.__moon__) {
    // Component was unmounted, destroy it here
    oldNode.__moon__.destroy();
  }

  // Replace It
  parent.replaceChild(newNode, oldNode);

  // Check for Component
  if(vnode.meta.component) {
    createComponentFromVNode(newNode, vnode, vnode.meta.component);
  }
}
