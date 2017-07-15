/**
 * Text VNode/Node Type
 */
const TEXT_TYPE = "#text";

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
 * @param {Object} props
 */
const diffProps = function(node, nodeProps, vnode, props) {
  // Get VNode Attributes
  const vnodeProps = props.attrs;

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
  if((vnodeDirectives = props.directives) !== undefined) {
    for(const directive in vnodeDirectives) {
      let directiveFn = null;
      if((directiveFn = directives[directive]) !== undefined) {
        directiveFn(node, vnodeDirectives[directive], vnode);
      }
    }
  }

  // Add/Update any DOM Props
  let dom = null;
  if((dom = props.dom) !== undefined) {
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
  let meta = vnode.meta;

  if(nodeName !== vnode.type) {
    const newNode = createNodeFromVNode(vnode);
    replaceChild(node, newNode, vnode, parent);
    return newNode;
  } else if(vnode.type === TEXT_TYPE) {
    // Both are text nodes, update if needed
    if(node.textContent !== vnode.val) {
      node.textContent = vnode.val;
    }

    // Hydrate
    meta.el = node;
  } else if(meta.component !== undefined) {
    // Component
    diffComponent(node, vnode);
    return node;
  } else {
    // Hydrate
    meta.el = node;

    // Diff props
    let props = vnode.props;
    diffProps(node, extractAttrs(node), vnode, props);

    // Add event listeners
    let eventListeners = null;
    if((eventListeners = meta.eventListeners) !== undefined) {
      addEventListeners(node, eventListeners);
    }

    // Ensure innerHTML wasn't changed
    const domProps = props.dom;
    if(domProps === undefined || domProps.innerHTML === undefined) {
      const children = vnode.children;
      const length = children.length;

      let i = 0;
      let currentChildNode = node.firstChild;
      let vchild = length !== 0 ? children[0] : null;

      while(vchild !== null || currentChildNode !== null) {
        if(vchild === null) {
          let nextSibling = null;
          do {
            nextSibling = currentChildNode.nextSibling;
            removeChild(currentChildNode, node);
            currentChildNode = nextSibling;
          } while(currentChildNode !== null);
          currentChildNode = null;
        } else if(currentChildNode === null) {
          for(; i < children.length; i++) {
            vchild = children[i];
            appendChild(createNodeFromVNode(vchild), vchild, node);
          }
          vchild = null;
        } else {
          const next = currentChildNode.nextSibling;
          hydrate(currentChildNode, vchild, node);
          vchild = ++i < length ? children[i] : null;
          currentChildNode = next;
        }
      }
    }
    return node;
  }
}

/**
 * Diffs VNodes, and applies Changes
 * @param {Object} oldVNode
 * @param {Array} oldChildren
 * @param {Object} vnode
 * @param {Array} children
 * @param {Number} index
 * @param {Object} parent
 * @return {Number} patch type
 */
const diff = function(oldVNode, oldChildren, vnode, children, index, parent) {
  let oldMeta = oldVNode.meta;
  let meta = vnode.meta;

  if(oldVNode.type !== vnode.type) {
    // Different types, replace
    oldChildren[index] = vnode;
    replaceChild(oldMeta.el, createNodeFromVNode(vnode), vnode, parent);
  } else if(meta.shouldRender === true) {
    if(vnode.type === TEXT_TYPE) {
      // Text, update if needed
      const val = vnode.val;
      if(oldVNode.val !== val) {
        oldVNode.val = val;
        oldMeta.el.textContent = val;
      }
    } else if(meta.component !== undefined) {
      // Component, diff props and slots
      diffComponent(oldMeta.el, vnode);
    } else {
      const node = oldMeta.el;

      // Diff props
      let oldProps = oldVNode.props;
      let props = vnode.props;
      diffProps(node, oldProps.attrs, vnode, props);
      oldProps.attrs = props.attrs;

      // Diff event listeners
      let eventListeners = null;
      if((eventListeners = meta.eventListeners) !== undefined) {
        diffEventListeners(node, eventListeners, oldMeta.eventListeners);
      }

      // Ensure innerHTML wasn't changed
      const domProps = props.dom;
      if(domProps === undefined || domProps.innerHTML === undefined) {
        // Diff children
        const children = vnode.children;
        const oldChildren = oldVNode.children;
        let newLength = children.length;
        let oldLength = oldChildren.length;

        if(newLength === 0 && oldLength !== 0) {
          let firstChild = null;
          while((firstChild = node.firstChild) !== null) {
            removeChild(firstChild, node);
          }
          oldVNode.children = [];
        } else if(oldLength === 0) {
          let childVnode = null;
          for(let i = 0; i < newLength; i++) {
            childVnode = children[i];
            appendChild(createNodeFromVNode(childVnode), childVnode, node);
          }
          oldVNode.children = children;
        } else {
          const totalLen = newLength > oldLength ? newLength : oldLength;
          let oldChild = null;
          let child = null;
          for(let i = 0; i < totalLen; i++) {
            if(i === newLength) {
              // Remove extra children
              let childNode = oldChildren[i].meta.el;
              let nextSibling = null;
              do {
                nextSibling = childNode.nextSibling;
                removeChild(childNode, node);
                childNode = nextSibling;
              } while(childNode !== null);
              oldChildren.length = newLength;
            } else if(i === oldLength) {
              // Add extra children
              let childVnode = null;
              for(; i < newLength; i++) {
                childVnode = children[i];
                appendChild(createNodeFromVNode(childVnode), childVnode, node);
              }
              oldVNode.children = children;
            } else {
              // Diff child if they don't have the same reference
              oldChild = oldChildren[i];
              child = children[i];

              if(oldChild !== child) {
                diff(oldChild, oldChildren, child, children, i, node);
              }
            }
          }
        }
      }
    }
  }
}
