/**
 * Text VNode/Node Type
 */
const TEXT_TYPE = "#text";

/**
 * Patch Types
 */
const PATCH = {
  SKIP: 0,
  APPEND: 1,
  REMOVE: 2,
  REPLACE: 3,
  TEXT: 4,
  CHILDREN: 5
}

/**
 * Gives Default Metadata for a VNode
 * @return {Object} metadata
 */
const defaultMetadata = function() {
  return {
    shouldRender: false
  }
}

/**
 * Adds an Event Listener to a VNode
 * @param {String} name
 * @param {String} handler
 * @return {Object} vnode
 */
const addEventListenerCodeToVNode = function(name, handler, vnode) {
  const meta = vnode.meta;
  let eventListeners = meta.eventListeners;
  if(eventListeners === undefined) {
    eventListeners = meta.eventListeners = {};
  }
  let eventHandlers = eventListeners[name];
  if(eventHandlers === undefined) {
    eventListeners[name] = [handler];
  } else {
    eventHandlers.push(handler);
  }
}

/**
 * Creates a Virtual DOM Node
 * @param {String} type
 * @param {String} val
 * @param {Object} props
 * @param {Object} meta
 * @param {Array} children
 * @return {Object} Virtual DOM Node
 */
const createElement = function(type, val, props, meta, children) {
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
 * @param {Object} props
 * @param {Array} children
 * @param {Object} functionalComponent
 * @return {Object} Virtual DOM Node
 */
const createFunctionalComponent = function(props, children, functionalComponent) {
  const options = functionalComponent.options;
  const attrs = props.attrs;
  let data = options.data;

  if(data === undefined) {
    data = {};
  }

  // Merge data with provided props
  const propNames = options.props;
  if(propNames === undefined) {
    data = attrs;
  } else {
    for(var i = 0; i < propNames.length; i++) {
      const prop = propNames[i];
      data[prop] = attrs[prop];
    }
  }

  // Call render function
  return functionalComponent.options.render(m, {
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
 * @return {Object} Object usable in Virtual DOM (VNode)
 */
const m = function(tag, attrs, meta, children) {
  let component = null;

  if(tag === TEXT_TYPE) {
    // Text Node
    // Tag => #text
    // Attrs => meta
    // Meta => val
    return createElement(TEXT_TYPE, meta, {attrs:{}}, attrs, []);
  } else if((component = components[tag]) !== undefined) {
    // Resolve Component
    if(component.options.functional === true) {
      return createFunctionalComponent(attrs, children, component);
    } else {
      meta.component = component;
    }
  }

  return createElement(tag, "", attrs, meta, children);

  // In the end, we have a VNode structure like:
  // {
  //  type: 'h1', <= nodename
  //  props: {
  //    attrs: {'id': 'someId'}, <= regular attributes
  //    dom: {'textContent': 'some text content'} <= only for DOM properties added by directives,
  //    directives: {'m-mask': ''} <= any directives
  //  },
  //  meta: {}, <= metadata used internally
  //  children: [], <= any child nodes
  // }
};

/**
 * Mounts a Component To The DOM
 * @param {Object} node
 * @param {Object} vnode
 * @param {Object} component
 * @return {Object} DOM Node
 */
const createComponentFromVNode = function(node, vnode, component) {
  const componentInstance = new component.CTor();
  const props = componentInstance.$props;
  const data = componentInstance.$data;
  const attrs = vnode.props.attrs;

  // Merge data with provided props
  for(let i = 0; i < props.length; i++) {
    const prop = props[i];
    data[prop] = attrs[prop];
  }

  // Check for events
  const eventListeners = vnode.meta.eventListeners;
  if(eventListeners !== undefined) {
    extend(componentInstance.$events, eventListeners);
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
 * Diffs Event Listeners of Two VNodes
 * @param {Object} node
 * @param {Object} eventListeners
 * @param {Object} oldEventListeners
 */
const diffEventListeners = function(node, eventListeners, oldEventListeners) {
  for(const type in eventListeners) {
    const oldEventListener = oldEventListeners[type];
    if(oldEventListener === undefined) {
      node.removeEventListener(type, oldEventListener);
    } else {
      oldEventListeners[type].handlers = eventListeners[type];
    }
  }
}

/**
 * Diffs Props of Node and a VNode, and apply Changes
 * @param {Object} node
 * @param {Object} nodeProps
 * @param {Object} vnode
 */
const diffProps = function(node, nodeProps, vnode) {
  // Get VNode Attributes
  const vnodeProps = vnode.props.attrs;

  // Diff VNode Props with Node Props
  for(let vnodePropName in vnodeProps) {
    const vnodePropValue = vnodeProps[vnodePropName];
    const nodePropValue = nodeProps[vnodePropName];

    if((vnodePropValue !== undefined && vnodePropValue !== false && vnodePropValue !== null) && ((nodePropValue === undefined || nodePropValue === false || nodePropValue === null) || vnodePropValue !== nodePropValue)) {
      if(vnodePropName.length === 10 && vnodePropName === "xlink:href") {
        node.setAttributeNS('http://www.w3.org/1999/xlink', "href", vnodePropValue);
      } else {
        node.setAttribute(vnodePropName, vnodePropValue === true ? '' : vnodePropValue);
      }
    }
  }

  // Diff Node Props with VNode Props
  for(let nodePropName in nodeProps) {
    const vnodePropValue = vnodeProps[nodePropName];
    if(vnodePropValue === undefined || vnodePropValue === false || vnodePropValue === null) {
      node.removeAttribute(nodePropName);
    }
  }

  // Execute any directives
  let vnodeDirectives = null;
  if((vnodeDirectives = vnode.props.directives) !== undefined) {
    for(const directive in vnodeDirectives) {
      let directiveFn = null;
      if((directiveFn = directives[directive]) !== undefined) {
        directiveFn(node, vnodeDirectives[directive], vnode);
      }
    }
  }

  // Add/Update any DOM Props
  let dom = null;
  if((dom = vnode.props.dom) !== undefined) {
    for(let domProp in dom) {
      const domPropValue = dom[domProp];
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
  if(node.__moon__ === undefined) {
    // Not mounted, create a new instance and mount it here
    createComponentFromVNode(node, vnode, vnode.meta.component);
  } else {
    // Mounted already, need to update
    let componentInstance = node.__moon__;
    let componentChanged = false;

    // Merge any properties that changed
    const props = componentInstance.$props;
    const data = componentInstance.$data;
    const attrs = vnode.props.attrs;
    for(var i = 0; i < props.length; i++) {
      let prop = props[i];
      if(data[prop] !== attrs[prop]) {
        data[prop] = attrs[prop];
        componentChanged = true;
      }
    }

    // If it has children, resolve any new slots
    if(vnode.children.length !== 0) {
      componentInstance.$slots = getSlots(vnode.children);
      componentChanged = true;
    }

    // If any changes were detected, build the component
    if(componentChanged === true) {
      componentInstance.build();
    }
  }
}

/**
 * Hydrates Node and a VNode
 * @param {Object} node
 * @param {Object} vnode
 * @param {Object} parent
 * @return {Object} adjusted node only if it was replaced
 */
const hydrate = function(node, vnode, parent) {
  const nodeName = node !== null ? node.nodeName.toLowerCase() : null;

  if(node === null) {
    // No node, create one
    const newNode = createNodeFromVNode(vnode);
    appendChild(newNode, vnode, parent);

    return newNode;
  } else if(vnode === null) {
    removeChild(node, parent);

    return null;
  } else if(nodeName !== vnode.type) {
    const newNode = createNodeFromVNode(vnode);
    replaceChild(node, newNode, vnode, parent);
    return newNode;
  } else if(vnode.type === TEXT_TYPE) {
    if(nodeName === TEXT_TYPE) {
      // Both are textnodes, update the node
      if(node.textContent !== vnode.val) {
        node.textContent = vnode.val;
      }

      // Hydrate
      vnode.meta.el = node;
    } else {
      // Node isn't text, replace with one
      replaceChild(node, createNodeFromVNode(vnode), vnode, parent);
    }

    return node;
  } else {
    // Hydrate
    vnode.meta.el = node;

    // Check for Component
    if(vnode.meta.component !== undefined) {
      // Diff the Component
      diffComponent(node, vnode);

      // Skip diffing any children
      return node;
    }

    // Diff props
    diffProps(node, extractAttrs(node), vnode);

    // Add event listeners
    let eventListeners = null;
    if((eventListeners = vnode.meta.eventListeners) !== undefined) {
      addEventListeners(node, eventListeners);
    }

    // Check if innerHTML was changed, and don't diff children if so
    const domProps = vnode.props.dom;
    if(domProps !== undefined && domProps.innerHTML !== undefined) {
      return node;
    }

    // Hydrate Children
    const children = vnode.children;
    const length = children.length;

    let i = 0;
    let currentChildNode = node.firstChild;
    let vchild = length !== 0 ? children[0] : null;

    while(vchild !== null || currentChildNode !== null) {
      const next = currentChildNode !== null ? currentChildNode.nextSibling : null;
      hydrate(currentChildNode, vchild, node);
      vchild = ++i < length ? children[i] : null;
      currentChildNode = next;
    }

    return node;
  }
}

/**
 * Diffs VNodes, and applies Changes
 * @param {Object} oldVNode
 * @param {Object} vnode
 * @param {Object} parent
 * @return {Number} patch type
 */
const diff = function(oldVNode, vnode, parent) {
  if(oldVNode === null) {
    // No Node, append a node
    appendChild(createNodeFromVNode(vnode), vnode, parent);

    return PATCH.APPEND;
  } else if(vnode === null) {
    // No New VNode, remove Node
    removeChild(oldVNode.meta.el, parent);

    return PATCH.REMOVE;
  } else if(oldVNode === vnode) {
    // Both have the same reference, skip
    return PATCH.SKIP;
  } else if(oldVNode.type !== vnode.type) {
    // Different types, replace it
    replaceChild(oldVNode.meta.el, createNodeFromVNode(vnode), vnode, parent);

    return PATCH.REPLACE;
  } else if(vnode.meta.shouldRender === true && vnode.type === TEXT_TYPE) {
    let node = oldVNode.meta.el;

    if(oldVNode.type === TEXT_TYPE) {
      // Both are textnodes, update the node
      if(vnode.val !== oldVNode.val) {
        node.textContent = vnode.val;
      }

      return PATCH.TEXT;
    } else {
      // Node isn't text, replace with one
      replaceChild(node, createNodeFromVNode(vnode), vnode, parent);
      return PATCH.REPLACE;
    }

  } else if(vnode.meta.shouldRender === true) {
    let node = oldVNode.meta.el;

    // Check for Component
    if(vnode.meta.component !== undefined) {
      // Diff Component
      diffComponent(node, vnode);

      // Skip diffing any children
      return PATCH.SKIP;
    }

    // Diff props
    diffProps(node, oldVNode.props.attrs, vnode);
    oldVNode.props.attrs = vnode.props.attrs;

    // Diff event listeners
    let eventListeners = null;
    if((eventListeners = vnode.meta.eventListeners) !== undefined) {
      diffEventListeners(node, eventListeners, oldVNode.meta.eventListeners);
    }

    // Check if innerHTML was changed, don't diff children
    const domProps = vnode.props.dom;
    if(domProps !== undefined && domProps.innerHTML !== undefined) {
      // Skip Children
      return PATCH.SKIP;
    }

    // Diff Children
    const children = vnode.children;
    const oldChildren = oldVNode.children;
    let newLength = children.length;
    let oldLength = oldChildren.length;

    if(newLength === 0) {
      // No Children, Remove all Children if not Already Removed
      if(oldLength !== 0) {
        let firstChild = null;
        while((firstChild = node.firstChild) !== null) {
          removeChild(firstChild, node);
        }
        oldVNode.children = [];
      }
    } else {
      // Traverse and Diff Children
      let totalLen = newLength > oldLength ? newLength : oldLength;
      for(let i = 0, j = 0; i < totalLen; i++, j++) {
        let oldChild = j < oldLength ? oldChildren[j] : null;
        let child = i < newLength ? children[i] : null;

        const action = diff(oldChild, child, node);

        // Update Children to Match Action
        switch (action) {
          case PATCH.APPEND:
            oldChildren[oldLength++] = child;
            break;
          case PATCH.REMOVE:
            oldChildren.splice(j--, 1);
            oldLength--;
            break;
          case PATCH.REPLACE:
            oldChildren[j] = children[i];
            break;
          case PATCH.TEXT:
            oldChild.val = child.val;
            break;
        }
      }
    }

    return PATCH.CHILDREN;
  } else {
    // Nothing Changed, Rehydrate and Exit
    vnode.meta.el = oldVNode.meta.el;
    return PATCH.SKIP;
  }
}
