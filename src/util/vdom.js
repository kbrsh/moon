const m = function(type, props, data, children) {
  if(type === "#text") {
    // Text virtual node
    return {
      type: type,
      value: data,
      data: props
    };
  } else {
    let component = components[type];
    if(component !== undefined) {
      // Component
      data.component = component;
    }

    // Virtual node
    return {
      type: type,
      props: props,
      data: data,
      children: children
    };
  }
};

m.emptyVNode = m("#text", {}, '');

m.renderClass = function(classNames) {
  if(typeof classNames === "string") {
    // String class names are already processed
    return classNames;
  } else {
    let renderedClassNames = '';
    let delimiter = '';
    if(Array.isArray(classNames)) {
      // It's an array concatenate them
      for(let i = 0; i < classNames.length; i++) {
        renderedClassNames += delimiter + m.renderClass(classNames[i]);
        delimiter = ' ';
      }
    } else if(typeof classNames === "object") {
      // Object of classnames, concatenate if value is true
      for(let className in classNames) {
        if(classNames[className] === true) {
          renderedClassNames += delimiter + className;
          delimiter = ' ';
        }
      }
    }

    return renderedClassNames;
  }
}

m.renderLoop = function(iteratable, item) {
  let items;

  if(Array.isArray(iteratable)) {
    // Render array
    const length = iteratable.length;
    items = new Array(length);
    for(let i = 0; i < length; i++) {
      items[i] = item(iteratable[i], i);
    }
  } else if(typeof iteratable === "object") {
    // Render object
    items = [];
    for(let key in iteratable) {
      items.push(item(iteratable[key], key));
    }
  } else if(typeof iteratable === "number") {
    // Render range
    items = new Array(iteratable);
    for(let i = 0; i < iteratable; i++) {
      items[i] = item(i + 1, i);
    }
  }

  return items;
}

const createComponent = function(node, vnode, component) {
  const props = component.options.props;
  const attrs = vnode.props.attrs;
  let componentProps = {};

  // Get component props
  if(props !== undefined) {
    for(let i = 0; i < props.length; i++) {
      const propName = props[i];
      componentProps[propName] = attrs[propName];
    }
  }

  // Create component options
  let componentOptions = {
    root: node,
    props: componentProps,
    insert: vnode.children
  };

  // Check for events
  const events = vnode.data.events;
  if(events === undefined) {
    componentOptions.events = {};
  } else {
    componentOptions.events = events;
  }

  // Initialize and mount instance
  const componentInstance = new component.CTor(componentOptions);

  // Update data
  const data = vnode.data;
  data.component = componentInstance;
  data.node = componentInstance.root;
}

const patchProps = function(node, nodeProps, vnode, props) {
  // Get VNode Attributes
  const vnodeProps = props.attrs;

  // Diff VNode Props with Node Props
  for(let vnodePropName in vnodeProps) {
    const vnodePropValue = vnodeProps[vnodePropName];
    const nodePropValue = nodeProps[vnodePropName];

    if((vnodePropValue !== false) && (nodePropValue === undefined || vnodePropValue !== nodePropValue)) {
      if(vnodePropName === "xlink:href") {
        node.setAttributeNS("http://www.w3.org/1999/xlink", "href", vnodePropValue);
      } else {
        node.setAttribute(vnodePropName, vnodePropValue === true ? '' : vnodePropValue);
      }
    }
  }

  // Diff Node Props with VNode Props
  for(let nodePropName in nodeProps) {
    const vnodePropValue = vnodeProps[nodePropName];
    if(vnodePropValue === undefined || vnodePropValue === false) {
      node.removeAttribute(nodePropName);
    }
  }

  // Execute any directives
  let vnodeDirectives = props.directives;
  if(vnodeDirectives !== undefined) {
    for(let directiveName in vnodeDirectives) {
      let directive = directives[directiveName];
      if(directive !== undefined) {
        directive(node, vnodeDirectives[directiveName], vnode);
      } else if("__ENV__" !== "production") {
        error(`Could not find directive "${directiveName}"`);
      }
    }
  }

  // Add/Update any DOM Props
  const domProps = props.dom;
  if(domProps !== undefined) {
    for(let domPropName in domProps) {
      node[domPropName] = domProps[domPropName];
    }
  }
}

const patchEvents = function(newEvents, oldEvents) {
  // Update event handlers
  for(let eventType in newEvents) {
    oldEvents[eventType].handlers = newEvents[eventType];
  }
}

const hydrate = function(node, vnode) {
  let data = vnode.data;

  // Add reference to node
  data.node = node;

  // Patch props
  const props = vnode.props;
  const nodeAttrs = node.attributes;
  let oldAttrs = {};
  for(let i = 0; i < nodeAttrs.length; i++) {
    const nodeAttr = nodeAttrs[i];
    oldAttrs[nodeAttr.name] = nodeAttr.value;
  }
  patchProps(node, oldAttrs, vnode, props);

  // Add events
  const events = data.events;
  if(events !== undefined) {
    addEvents(node, events);
  }

  // Hydrate children
  const domProps = props.dom;
  if((domProps === undefined) || (domProps.innerHTML === undefined && domProps.textContent === undefined)) {
    const children = vnode.children;
    const childrenLength = children.length;

    let i = 0;

    let childVNode = i === childrenLength ? undefined : children[i];
    let childNode = node.firstChild;

    while(childVNode !== undefined || childNode !== null) {
      if(childNode === null) {
        // Node doesn't exist, create and append a node
        appendChild(childVNode, node);
      } else {
        let nextSibling = childNode.nextSibling;

        if(childVNode === undefined) {
          // No VNode, remove the node
          node.removeChild(childNode);
        } else {
          const component = childVNode.data.component;
          if(component !== undefined) {
            // Create a component
            createComponent(childNode, childVNode, component);
          } else {
            const type = childVNode.type;
            if(childNode.nodeName.toLowerCase() !== type) {
              // Different types, replace nodes
              node.replaceChild(createNode(childVNode), childNode);
            } else if(type === "#text") {
              // Text node, update
              childNode.textContent = childVNode.value;
              childVNode.data.node = childNode;
            } else {
              // Hydrate
              hydrate(childNode, childVNode);
            }
          }
        }

        childNode = nextSibling;
      }

      childVNode = ++i < childrenLength ? children[i] : undefined;
    }
  }
}

const patch = function(newVNode, oldVNode) {
  let oldData = oldVNode.data;
  const node = oldData.node;

  // Patch props
  const newProps = newVNode.props;
  patchProps(node, oldVNode.props.attrs, newVNode, newProps);
  oldVNode.props = newProps;

  // Patch events
  const newEvents = newVNode.data.events;
  if(newEvents !== undefined) {
    patchEvents(newEvents, oldData.events);
  }

  // Patch children
  const newChildren = newVNode.children;
  const oldChildren = oldVNode.children;

  const newLength = newChildren.length;
  const oldLength = oldChildren.length;
  const totalLength = newLength > oldLength ? newLength : oldLength;

  for(let i = 0; i < totalLength; i++) {
    if(i >= newLength) {
      // Past length of new children, remove child
      const oldChild = oldChildren.pop();
      const oldChildData = oldChild.data;
      const oldComponentInstance = oldChildData.component;

      if(oldComponentInstance !== undefined) {
        oldComponentInstance.destroy();
      }

      node.removeChild(oldChildData.node);
    } else if(i >= oldLength) {
      // Past length of old children, append child
      appendChild((oldChildren[i] = newChildren[i]), node);
    } else {
      const newChild = newChildren[i];
      const oldChild = oldChildren[i];

      const newType = newChild.type;
      if(newType !== oldChild.type) {
        // Types are different, replace child
        const oldChildData = oldChild.data;
        const oldComponentInstance = oldChildData.component;

        if(oldComponentInstance !== undefined) {
          oldComponentInstance.destroy();
        }

        const newComponent = newChild.data.component;
        if(newComponent === undefined) {
          node.replaceChild(createNode(newChild), oldChildData.node);
        } else {
          createComponent(oldChildData.node, newChild, newComponent);
        }

        oldChildren[i] = newChild;
      } else if(newChild !== oldChild) {
        const oldChildData = oldChild.data;
        const componentInstance = oldChildData.component;
        if(componentInstance !== undefined) {
          // Component found
          let componentChanged = false;

          const componentProps = componentInstance.options.props;
          if(componentProps !== undefined) {
            // Update component props
            const newChildAttrs = newChild.props.attrs;
            const componentObserver = componentInstance.observer;
            let componentData = componentInstance.data;

            for(let j = 0; j < componentProps.length; j++) {
              const componentPropName = componentProps[j];
              componentData[componentPropName] = newChildAttrs[componentPropName];
              componentObserver.notify(componentPropName);
            }

            componentChanged = true;
          }

          // Patch component events
          const newChildEvents = newChild.data.events;
          if(newChildEvents !== undefined) {
            patchEvents(newChildEvents, oldChildData.events);
          }

          // Add insert
          const newChildChildren = newChild.children;
          if(newChildChildren.length !== 0) {
            componentInstance.insert = newChildChildren;
            componentChanged = true;
          }

          // Build component if changed
          if(componentChanged === true) {
            componentInstance.build();
            callHook(componentInstance, "updated");
          }
        } else if(newType === "#text") {
          // Text node, update value
          const newValue = newChild.value;
          oldChildData.node.textContent = newValue;
          oldChild.value = newValue;
        } else {
          // Patch children
          patch(newChild, oldChild);
        }
      }
    }
  }
}
