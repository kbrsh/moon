const m = function(type, props, data, children) {
  if(type === "#text") {
    // Text virtual node
    return {
      type: type,
      value: props,
      data: {}
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

m.flatten = function(children) {
  for(let i = 0; i < children.length; ) {
    let child = children[i];
    if(Array.isArray(child) === true) {
      const childLength = child.length;
      child.unshift(i, 1);
      children.splice.apply(children, child);
      child.slice(2, 0);
      i += childLength;
    } else {
      i++;
    }
  }

  return children;
}

m.renderClass = function(classNames) {
  if(typeof classNames === "string") {
    // String class names are already processed
    return classNames;
  } else {
    let renderedClassNames = '';
    let separator = '';
    if(Array.isArray(classNames) === true) {
      // It's an array concatenate them
      for(let i = 0; i < classNames.length; i++) {
        renderedClassNames += separator + m.renderClass(classNames[i]);
        separator = ' ';
      }
    } else if(typeof classNames === "object") {
      // Object of classnames, concatenate if value is true
      for(let className in classNames) {
        if(classNames[className] === true) {
          renderedClassNames += separator + className;
          separator = ' ';
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

const patchProps = function(node, nodeAttrs, vnode, props) {
  // Get VNode Attributes
  const vnodeAttrs = props.attrs;

  if(vnodeAttrs === undefined) {
    if(nodeAttrs !== undefined) {
      // Remove all
      for(let nodeAttrName in nodeAttrs) {
        node.removeAttribute(nodeAttrName);
      }
    }
  } else {
    if(nodeAttrs === undefined) {
      // Add all
      for(let vnodeAttrName in vnodeAttrs) {
        const vnodeAttrValue = vnodeAttrs[vnodeAttrName];
        node.setAttribute(vnodeAttrName, vnodeAttrValue === true ? '' : vnodeAttrValue);
      }
    } else {
      // Add
      for(let vnodeAttrName in vnodeAttrs) {
        const vnodeAttrValue = vnodeAttrs[vnodeAttrName];
        const nodeAttrValue = nodeAttrs[vnodeAttrName];

        if((vnodeAttrValue !== false) && (nodeAttrValue === undefined || vnodeAttrValue !== nodeAttrValue)) {
          node.setAttribute(vnodeAttrName, vnodeAttrValue === true ? '' : vnodeAttrValue);
        }
      }

      // Remove
      for(let nodeAttrName in nodeAttrs) {
        const vnodeAttrValue = vnodeAttrs[nodeAttrName];
        if(vnodeAttrValue === undefined || vnodeAttrValue === false) {
          node.removeAttribute(nodeAttrName);
        }
      }
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

const patchChildren = function(newChildren, oldChildren, parentNode) {
  const newLength = newChildren.length;
  const oldLength = oldChildren.length;
  const totalLength = newLength > oldLength ? newLength : oldLength;

  for(let i = 0; i < totalLength; i++) {
    if(i >= newLength) {
      // Past length of new children, remove child
      removeVNode(oldChildren.pop(), parentNode);
    } else if(i >= oldLength) {
      // Past length of old children, append child
      appendVNode((oldChildren[i] = newChildren[i]), parentNode);
    } else {
      const newChild = newChildren[i];
      const oldChild = oldChildren[i];

      const newChildType = newChild.type;
      if(newChildType !== oldChild.type) {
        // Types are different, replace child
        replaceVNode(newChild, oldChild, parentNode);
        oldChildren[i] = newChild;
      } else if(newChild !== oldChild) {
        const oldChildData = oldChild.data;
        const oldChildComponentInstance = oldChildData.component;
        if(oldChildComponentInstance !== undefined) {
          // Component found
          let componentChanged = false;

          const oldChildComponentInstanceProps = oldChildComponentInstance.options.props;
          if(oldChildComponentInstanceProps !== undefined) {
            // Update component props
            const newChildAttrs = newChild.props.attrs;
            const oldChildComponentInstanceObserver = oldChildComponentInstance.observer;
            let oldChildComponentInstanceData = oldChildComponentInstance.data;

            for(let j = 0; j < oldChildComponentInstanceProps.length; j++) {
              const oldChildComponentInstancePropName = oldChildComponentInstanceProps[j];
              oldChildComponentInstanceData[oldChildComponentInstancePropName] = newChildAttrs[oldChildComponentInstancePropName];
              oldChildComponentInstanceObserver.notify(oldChildComponentInstancePropName);
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
            oldChildComponentInstance.insert = newChildChildren;
            componentChanged = true;
          }

          // Build component if changed
          if(componentChanged === true) {
            oldChildComponentInstance.build();
            callHook(oldChildComponentInstance, "updated");
          }
        } else if(newChildType === "#text") {
          // Text node, update value
          const newChildValue = newChild.value;
          oldChildData.node.textContent = newChildValue;
          oldChild.value = newChildValue;
        } else {
          // Patch child
          patch(newChild, oldChild);
        }
      }
    }
  }
}

const hydrate = function(node, vnode) {
  let vnodeData = vnode.data;

  // Add reference to node
  vnodeData.node = node;

  // Patch props
  const vnodeProps = vnode.props;
  const nodeAttributes = node.attributes;
  let nodeAttrs = {};
  for(let i = 0; i < nodeAttributes.length; i++) {
    const nodeAttribute = nodeAttributes[i];
    nodeAttrs[nodeAttribute.name] = nodeAttribute.value;
  }
  patchProps(node, nodeAttrs, vnode, vnodeProps);

  // Add events
  const vnodeEvents = vnodeData.events;
  if(vnodeEvents !== undefined) {
    addEvents(node, vnodeEvents);
  }

  // Hydrate children
  const vnodeDomProps = vnodeProps.dom;
  if((vnodeDomProps === undefined) || (vnodeDomProps.innerHTML === undefined && vnodeDomProps.textContent === undefined)) {
    const vnodeChildren = vnode.children;
    const vnodeChildrenLength = vnodeChildren.length;

    let i = 0;

    let childVNode = i === vnodeChildrenLength ? undefined : vnodeChildren[i];
    let childNode = node.firstChild;

    while(childVNode !== undefined || childNode !== null) {
      if(childNode === null) {
        // Node doesn't exist, create and append a node
        appendVNode(childVNode, node);
      } else {
        let nextSibling = childNode.nextSibling;

        if(childVNode === undefined) {
          // No VNode, remove the node
          removeNode(childNode, node);
        } else {
          const childVNodeComponent = childVNode.data.component;
          if(childVNodeComponent !== undefined) {
            // Create a component
            createComponent(childNode, childVNode, childVNodeComponent);
          } else {
            const childVNodeType = childVNode.type;
            if(childNode.nodeName.toLowerCase() !== childVNodeType) {
              // Different types, replace nodes
              replaceNode(createNode(childVNode), childNode, node);
            } else if(childVNodeType === "#text") {
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

      childVNode = ++i < vnodeChildrenLength ? vnodeChildren[i] : undefined;
    }
  }
}

const patch = function(newVNode, oldVNode) {
  const oldVNodeData = oldVNode.data;
  const oldVNodeNode = oldVNodeData.node;

  // Patch props
  const newVNodeProps = newVNode.props;
  patchProps(oldVNodeNode, oldVNode.props.attrs, newVNode, newVNodeProps);
  oldVNode.props = newVNodeProps;

  // Patch events
  const newVNodeEvents = newVNode.data.events;
  if(newVNodeEvents !== undefined) {
    patchEvents(newVNodeEvents, oldVNodeData.events);
  }

  // Patch children
  patchChildren(newVNode.children, oldVNode.children, oldVNodeNode);
}
