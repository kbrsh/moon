/**
 * Text VNode/Node Type
 */
const TEXT_TYPE = "#text";

/**
 * Creates a Virtual DOM Node
 * @param {String} type
 * @param {Object} props
 * @param {Object} meta
 * @param {Array} children
 * @return {Object} Virtual DOM Node
 */
const createElement = function(type, props, meta, children) {
  return {
    type: type,
    props: props,
    meta: meta,
    children: children
  };
}

/**
 * Creates a Virtual DOM Text Node
 * @param {String} value
 * @param {Object} meta
 * @return {Object} Virtual DOM Text Node
 */
const createTextElement = function(value, meta) {
  return {
    type: TEXT_TYPE,
    value: value,
    meta: meta
  };
}

/**
 * Compiles Arguments to a VNode
 * @param {String} type
 * @param {Object} attrs
 * @param {Object} meta
 * @param {Object|String} children
 * @return {Object} Object usable in Virtual DOM (VNode)
 */
const m = function(type, props, meta, children) {
  let component;

  if(type === TEXT_TYPE) {
    // Text Node
    // Type => #text
    // Meta => props
    // Value => meta
    return createTextElement(meta, props);
  } else if((component = components[type]) !== undefined) {
    // Resolve Component
    if(component.options.functional === true) {
      return createFunctionalComponent(props, children, component);
    } else {
      meta.component = component;
    }
  }

  return createElement(type, props, meta, children);

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
 * Renders a Class in Array/Object Form
 * @param {Array|Object|String} classNames
 * @return {String} renderedClassNames
 */
m.renderClass = function(classNames) {
  if(typeof classNames === "string") {
    // If they are a string, no need for any more processing
    return classNames;
  }

  let renderedClassNames = '';
  if(Array.isArray(classNames)) {
    // It's an array, so go through them all and generate a string
    for(let i = 0; i < classNames.length; i++) {
      renderedClassNames += `${m.renderClass(classNames[i])} `;
    }
  } else if(typeof classNames === "object") {
    // It's an object, so to through and render them to a string if the corresponding condition is truthy
    for(let className in classNames) {
      if(classNames[className]) {
        renderedClassNames += `${className} `;
      }
    }
  }

  // Remove trailing space and return
  renderedClassNames = renderedClassNames.slice(0, -1);
  return renderedClassNames;
}

/**
 * Renders "m-for" Directive Array
 * @param {Array|Object|Number} iteratable
 * @param {Function} item
 */
m.renderLoop = function(iteratable, item) {
  let items;

  if(Array.isArray(iteratable)) {
    items = new Array(iteratable.length);

    // Iterate through the array
    for(let i = 0; i < iteratable.length; i++) {
      items[i] = item(iteratable[i], i);
    }
  } else if(typeof iteratable === "object") {
    items = [];

    // Iterate through the object
    for(let key in iteratable) {
      items.push(item(iteratable[key], key));
    }
  } else if(typeof iteratable === "number") {
    items = new Array(iteratable);

    // Repeat a certain amount of times
    for(let i = 0; i < iteratable; i++) {
      items[i] = item(i + 1, i);
    }
  }

  return items;
}

/**
 * Renders an Event Modifier
 * @param {Number} keyCode
 * @param {String} modifier
 */
 m.renderEventModifier = function(keyCode, modifier) {
  return keyCode === eventModifiers[modifier];
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
  let data = {};
  let getData = options.data;

  if(getData !== undefined) {
    data = getData();
  }

  // Merge data with provided props
  const propNames = options.props;
  if(propNames === undefined) {
    data = attrs;
  } else {
    for(let i = 0; i < propNames.length; i++) {
      const prop = propNames[i];
      data[prop] = attrs[prop];
    }
  }

  // Call render function
  return options.render(m, {
    data: data,
    insert: children
  });
}

/**
 * Mounts a Component To The DOM
 * @param {Object} node
 * @param {Object} vnode
 * @param {Object} component
 * @return {Object} DOM Node
 */
const createComponentFromVNode = function(node, vnode, component) {
  const componentInstance = new component.CTor();
  const props = componentInstance.options.props;
  const attrs = vnode.props.attrs;
  let data = componentInstance.data;

  // Merge data with provided props
  if(props !== undefined) {
    for(let i = 0; i < props.length; i++) {
      const prop = props[i];
      data[prop] = attrs[prop];
    }
  }

  // Check for events
  const eventListeners = vnode.meta.eventListeners;
  if(eventListeners !== undefined) {
    extend(componentInstance.events, eventListeners);
  }

  componentInstance.insert = vnode.children;
  componentInstance.root = node;
  componentInstance.build();
  callHook(componentInstance, "mounted");

  // Rehydrate
  vnode.meta.node = componentInstance.root;

  return componentInstance.root;
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
      addEventHandler(node, type, eventListeners);
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
  let vnodeDirectives = props.directives;
  if(vnodeDirectives !== undefined) {
    for(let directive in vnodeDirectives) {
      let directiveFn = directives[directive];
      if(directiveFn !== undefined) {
        directiveFn(node, vnodeDirectives[directive], vnode);
      } else if("__ENV__" !== "production") {
        error(`Could not find directive "${directive}"`);
      }
    }
  }

  // Add/Update any DOM Props
  let dom = props.dom;
  if(dom !== undefined) {
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
    const props = componentInstance.options.props;
    const data = componentInstance.data;
    const attrs = vnode.props.attrs;

    if(props !== undefined) {
      for(let i = 0; i < props.length; i++) {
        const prop = props[i];
        if(data[prop] !== attrs[prop]) {
          data[prop] = attrs[prop];
          componentChanged = true;
        }
      }
    }


    // If it has children, resolve insert
    if(vnode.children.length !== 0) {
      componentInstance.insert = vnode.children;
      componentChanged = true;
    }

    // If any changes were detected, build the component
    if(componentChanged === true) {
      componentInstance.build();
      callHook(componentInstance, "updated");
    }
  }
}

/**
 * Hydrates Node and a VNode
 * @param {Object} node
 * @param {Object} vnode
 * @param {Object} parent
 * @return {Object} adjusted node
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
    if(node.textContent !== vnode.value) {
      node.textContent = vnode.value;
    }

    // Hydrate
    meta.node = node;
  } else if(meta.component !== undefined) {
    // Component
    diffComponent(node, vnode);
    return node;
  } else {
    // Hydrate
    meta.node = node;

    // Diff props
    let props = vnode.props;
    diffProps(node, extractAttrs(node), vnode, props);

    // Add event listeners
    let eventListeners = meta.eventListeners;
    if(eventListeners !== undefined) {
      addEventListeners(node, eventListeners);
    }

    // Ensure innerHTML and textContent weren't changed
    const domProps = props.dom;
    if(domProps === undefined || (domProps.innerHTML === undefined && domProps.textContent === undefined)) {
      const children = vnode.children;
      const length = children.length;

      let i = 0;
      let currentChildNode = node.firstChild;
      let vchild = length !== 0 ? children[0] : undefined;
      let nextSibling = null;

      while(vchild !== undefined || currentChildNode !== null) {
        nextSibling = null;

        if(currentChildNode === null) {
          appendChild(createNodeFromVNode(vchild), vchild, node);
        } else {
          nextSibling = currentChildNode.nextSibling;
          if(vchild === undefined) {
            removeChild(currentChildNode, node);
          } else {
            hydrate(currentChildNode, vchild, node);
          }
        }

        vchild = ++i < length ? children[i] : undefined;
        currentChildNode = nextSibling;
      }
    }
    return node;
  }
}

/**
 * Diffs VNodes, and applies Changes
 * @param {Object} oldVNode
 * @param {Object} vnode
 * @param {Number} index
 * @param {Object} parent
 * @param {Object} parentVNode
 */
const diff = function(oldVNode, vnode, index, parent, parentVNode) {
  let oldMeta = oldVNode.meta;
  let meta = vnode.meta;

  if(oldVNode.type !== vnode.type) {
    // Different types, replace
    parentVNode.children[index] = vnode;
    replaceChild(oldMeta.node, createNodeFromVNode(vnode), vnode, parent);
  } else if(meta.shouldRender !== undefined) {
    if(vnode.type === TEXT_TYPE) {
      // Text, update if needed
      const value = vnode.value;
      if(oldVNode.value !== value) {
        oldVNode.value = value;
        oldMeta.node.textContent = value;
      }
    } else if(meta.component !== undefined) {
      // Component, diff props and insert
      diffComponent(oldMeta.node, vnode);
    } else {
      const node = oldMeta.node;

      // Diff props
      let oldProps = oldVNode.props;
      let props = vnode.props;
      diffProps(node, oldProps.attrs, vnode, props);
      oldProps.attrs = props.attrs;

      // Diff event listeners
      let eventListeners = meta.eventListeners;
      if(eventListeners !== undefined) {
        diffEventListeners(node, eventListeners, oldMeta.eventListeners);
      }

      // Ensure innerHTML wasn't changed
      const domProps = props.dom;
      if(domProps === undefined || (domProps.innerHTML === undefined && domProps.textContent === undefined)) {
        // Diff children
        const children = vnode.children;
        const oldChildren = oldVNode.children;
        const newLength = children.length;
        const oldLength = oldChildren.length;

        if(newLength === 0 && oldLength !== 0) {
          let firstChild = null;
          while((firstChild = node.firstChild) !== null) {
            removeChild(firstChild, node);
          }
          oldVNode.children = [];
        } else if(oldLength === 0) {
          for(let i = 0; i < newLength; i++) {
            let child = children[i];
            appendChild(createNodeFromVNode(child), child, node);
          }
          oldVNode.children = children;
        } else {
          const totalLen = newLength > oldLength ? newLength : oldLength;
          let oldChild;
          let child;
          for(let i = 0; i < totalLen; i++) {
            if(i >= newLength) {
              // Remove extra child
              removeChild(oldChildren.pop().meta.el, node);
            } else if(i >= oldLength) {
              // Add extra child
              child = children[i];
              appendChild(createNodeFromVNode(child), child, node);
              oldChildren.push(child);
            } else {
              // Diff child if they don't have the same reference
              oldChild = oldChildren[i];
              child = children[i];

              if(oldChild !== child) {
                diff(oldChild, child, i, node, oldVNode);
              }
            }
          }
        }
      }
    }
  }
}
