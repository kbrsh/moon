/**
 * Creates a Virtual DOM Node
 * @param {String} type
 * @param {String} val
 * @param {Object} props
 * @param {Array} children
 * @param {Object} meta
 * @return {Object} Virtual DOM Node
 */
const createElement = function(type, val, props, children, meta) {
  return {
    type: type,
    val: val,
    props: props,
    children: children,
    meta: meta || defaultMetadata()
  };
}

/**
 * Creates a Functional Component
 * @param {String} type
 * @param {Object} props
 * @param {Object} meta
 * @param {Array} children
 * @param {Object} functionalComponent
 * @return {Object} Virtual DOM Node
 */
const createFunctionalComponent = function(type, props, meta, children, functionalComponent) {
  let data = functionalComponent.opts.data || {};
  // Merge data with provided props
  if(functionalComponent.opts.props) {
    for(var i = 0; i < functionalComponent.opts.props.length; i++) {
      var prop = functionalComponent.opts.props[i];
      data[prop] = props.attrs[prop];
    }
  }
  return functionalComponent.opts.render(h, {
    data: data,
    slots: getSlots(children)
  });
}

/**
 * Compiles Arguments to a VNode
 * @param {String} tag
 * @param {Object} attrs
 * @param {Object} meta
 * @param {Object|String} children
 * @return {String} Object usable in Virtual DOM (VNode)
 */
const h = function(tag, attrs, meta, nestedChildren) {
  // Setup Children
  let children = [];
  if(nestedChildren) {
    for(var i = 0; i < nestedChildren.length; i++) {
      let child = nestedChildren[i];
      if(Array.isArray(child)) {
        children = children.concat(child);
      } else if(typeof child === "string" || child === null) {
        children.push(createElement("#text", child || "", {attrs: {}}, [], defaultMetadata()));
      } else {
        children.push(child);
      }
    }
  }

  // It's a Component
  if(components[tag]) {
    // Functional component
    if(components[tag].opts.functional) {
      return createFunctionalComponent(tag, attrs, meta, children, components[tag]);
    } else {
      // Provide the instance to diff engine
      meta.component = components[tag];
    }
  }

  // In the end, we have a VNode structure like:
  // {
  //  type: 'h1', <= nodename
  //  props: {
  //    attrs: {id: 'someId'}, <= regular attributes
  //    dom: {textContent: 'some text content'} <= only for DOM properties added by directives
  //  },
  //  meta: {}, <= metadata used internally
  //  children: [], <= any child nodes or text
  // }

  return createElement(tag, "", attrs, children, meta);
};

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

  // Check for Component
  if(vnode.meta.component) {
    createComponentFromVNode(el, vnode, vnode.meta.component);
  }

  return el;
}

/**
 * Mounts a Component To The DOM
 * @param {Object} node
 * @param {Object} vnode
 * @param {Object} component
 * @return {Object} DOM Node
 */
const createComponentFromVNode = function(node, vnode, component) {
  let componentInstance = new component.CTor();
  // Merge data with provided props
  for(let i = 0; i < componentInstance.$props.length; i++) {
    var prop = componentInstance.$props[i];
    componentInstance.$data[prop] = vnode.props.attrs[prop];
  }
  componentInstance.$slots = getSlots(vnode.children);
  componentInstance.$el = node;
  componentInstance.build();
  callHook(componentInstance, 'mounted');

  // Rehydrate
  vnode.meta.el = componentInstance.$el;

  return componentInstance.$el;
}

/**
 * Removes a Child, Ensuring Components are Unmounted
 * @param {Object} node
 * @param {Object} parent
 */
const removeChild = function(node, parent) {
  // Check for Component
  if(node.__moon__) {
    // Component was unmounted, destroy it here
    node.__moon__.destroy();
  }

  // No vnode, remove the node
  parent.removeChild(node);
}

/**
 * Replaces a Child, Ensuring Components are Unmounted/Mounted
 * @param {Object} oldNode
 * @param {Object} newNode
 * @param {Object} parent
 */
const replaceChild = function(oldNode, newNode, parent) {
  // Check for Component
  if(oldNode.__moon__) {
    // Component was unmounted, destroy it here
    oldNode.__moon__.destroy();
  }

  // Replace It
  parent.replaceChild(newNode, oldNode);
}

/**
 * Diffs Props of Node and a VNode, and apply Changes
 * @param {Object} node
 * @param {Object} nodeProps
 * @param {Object} vnode
 * @param {Object} vnodeProps
 */
const diffProps = function(node, nodeProps, vnode, vnodeProps) {
  // If node is svg, update with SVG namespace
  const isSVG = node instanceof SVGElement;

  // Diff VNode Props with Node Props
  if(vnodeProps) {
    for(let vnodePropName in vnodeProps) {
      var vnodePropValue = vnodeProps[vnodePropName];
      var nodePropValue = nodeProps[vnodePropName];

      if(nodePropValue == null || vnodePropValue !== nodePropValue) {
        isSVG ? node.setAttributeNS(null, vnodePropName, vnodePropValue) : node.setAttribute(vnodePropName, vnodePropValue);
      }
    }
  }

  // Diff Node Props with VNode Props
  if(nodeProps) {
    for(let nodePropName in nodeProps) {
      var vnodePropValue = vnodeProps[nodePropName];
      var nodePropValue = nodeProps[nodePropName];
      
      if(vnodePropValue == null || directives[nodePropName]) {
        if(directives[nodePropName]) {
          directives[nodePropName](node, vnodePropValue, vnode);
        }
        isSVG ? node.removeAttributeNS(null, nodePropName) : node.removeAttribute(nodePropName);
      }
    }
  }

  // Add/Update any DOM Props
  if(vnode.props.dom) {
    for(let domProp in vnode.props.dom) {
      const domPropValue = vnode.props.dom[domProp];
      if(node[domProp] !== domPropValue) {
        node[domProp] = domPropValue;
      }
    }
  }
}

/**
 * Diffs a Component
 * @param {Object} node
 * @param {Object} vnode
 * @return {Object} adjusted node only if it was replaced
 */
const diffComponent = function(node, vnode) {
  if(!node.__moon__) {
    // Not mounted, create a new instance and mount it here
    createComponentFromVNode(node, vnode, vnode.meta.component);
  } else {
    // Mounted already, need to update
    let componentInstance = node.__moon__;
    let componentChanged = false;
    // Merge any properties that changed
    for(var i = 0; i < componentInstance.$props.length; i++) {
      let prop = componentInstance.$props[i];
      if(componentInstance.$data[prop] !== vnode.props.attrs[prop]) {
        componentInstance.$data[prop] = vnode.props.attrs[prop];
        componentChanged = true;
      }
    }
    // If it has children, resolve any new slots
    if(vnode.children) {
      componentInstance.$slots = getSlots(vnode.children);
      componentChanged = true;
    }
    // If any changes were detected, build the component
    if(componentChanged) {
      componentInstance.build();
    }
  }
}

/**
 * Hydrates Node and a VNode
 * @param {Object} node
 * @param {Object} vnode
 * @param {Object} parent
 * @param {Object} instance
 * @return {Object} adjusted node only if it was replaced
 */
const hydrate = function(node, vnode, parent, instance) {
  let nodeName = node ? node.nodeName.toLowerCase() : null;

  if(!node) {
    // No node, create one
    var newNode = createNodeFromVNode(vnode, instance);
    parent.appendChild(newNode);

    return newNode;
  } else if(!vnode) {
    removeChild(node, parent);

    return null;
  } else if(nodeName !== vnode.type) {
    var newNode = createNodeFromVNode(vnode, instance);
    replaceChild(node, newNode, parent);
    return newNode;
  } else if(vnode.meta.shouldRender && vnode.type === "#text") {
    if(node && nodeName === "#text") {
      // Both are textnodes, update the node
      if(node.nodeValue !== vnode.val) {
        node.nodeValue = vnode.val;
      }

      // Hydrate
      vnode.meta.el = node;
    } else {
      // Node isn't text, replace with one
      replaceChild(node, createNodeFromVNode(vnode, instance), parent);
    }

    return node;
  } else if(vnode.meta.shouldRender) {
    // Hydrate
    vnode.meta.el = node;

    // Check for Component
    if(vnode.meta.component) {
      // Diff the Component
      diffComponent(node, vnode);

      // Skip diffing any children
      return node;
    }

    // Diff props
    diffProps(node, extractAttrs(node), vnode, vnode.props.attrs);

    // Add event listeners
    addEventListeners(node, vnode, instance);

    // Check if innerHTML was changed, and don't diff children if so
    if(vnode.props.dom && vnode.props.dom.innerHTML) {
      return node;
    }

    // Hydrate Children
    var i = 0;
    let currentChildNode = node.firstChild;
    let vchild = vnode.children[i];
    while(vchild || currentChildNode) {
      hydrate(currentChildNode, vchild, node, instance);
      vchild = vnode.children[++i];
      currentChildNode = currentChildNode ? currentChildNode.nextSibling : null;
    }

    return node;
  } else {
    // Nothing Changed, Hydrate and Exit
    vnode.meta.el = node;
    return node;
  }
}

/**
 * Diffs Node and a VNode, and applies Changes
 * @param {Object} node
 * @param {Object} vnode
 * @param {Object} parent
 * @param {Object} instance
 * @return {Object} adjusted node
 */
const diff = function(oldVNode, vnode, parent, instance) {
  if(!oldVNode) {
    // No Node, create a node
    var newNode = createNodeFromVNode(vnode, instance);
    parent.appendChild(newNode);

    return newNode;
  } else if(!vnode) {
    // No New VNode, remove Node
    removeChild(oldVNode.meta.el, parent);

    return null;
  } else if(oldVNode.type !== vnode.type) {
    // Different types, replace it
    var newNode = createNodeFromVNode(vnode, instance);
    replaceChild(oldVNode.meta.el, newNode, parent);

    return newNode;
  } else if(vnode.meta.shouldRender && vnode.type === "#text") {
    if(oldVNode.type === "#text") {
      // Both are textnodes, update the node
      if(vnode.val !== oldVNode.val) {
        oldVNode.meta.el.nodeValue = vnode.val;
      }

      // Rehydrate
      vnode.meta.el = oldVNode.meta.el;
    } else {
      // Node isn't text, replace with one
      parent.replaceChild(createNodeFromVNode(vnode, instance), oldVNode.meta.el);
    }

    return vnode.meta.el;
  } else if(vnode.meta.shouldRender) {
    // Check for Component
    let node = oldVNode.meta.el;

    if(vnode.meta.component) {
      // Diff Component
      diffComponent(node, vnode);

      // Skip diffing any children
      return node;
    }

    // Diff props
    diffProps(node, oldVNode.props.attrs, vnode, vnode.props.attrs);

    // Check if innerHTML was changed, don't diff children
    if(vnode.props.dom && vnode.props.dom.innerHTML) {
      // Rehydrate
      vnode.meta.el = node;

      // Skip Children
      return node;
    }

    // Diff Children
    let newLength = vnode.children.length;
    let oldLength = oldVNode.children.length;
    let newText = null;
    let oldText = null;

    if(newLength === 1 && ((newText = vnode.children[0]).type === "#text") && oldLength === 1 && ((oldText = oldVNode.children[0]).type === "#text")) {
      // Optimization:
      //  If the vnode contains just one text vnode, create/update it here
      if(newText.val !== oldText.val) {
        // Set Content
        node.textContent = newText.val;

        // Rehydrate
        newText.meta.el = node.firstChild;
      }
    } else {
      // Just Iterate through All Children
      let totalLen = newLength > oldLength ? newLength : oldLength;
      for(var i = 0; i < totalLen; i++) {
        diff(oldVNode.children[i], vnode.children[i], node, instance);
      }
    }

    // Rehydrate
    vnode.meta.el = node;

    // Exit
    return node;
  } else {
    // Nothing Changed, Rehydrate and Exit
    vnode.meta.el = oldVNode.meta.el;
    return vnode.meta.el;
  }
}
