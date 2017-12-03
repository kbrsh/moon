const addEvents = function(node, events) {
  for(let eventType in events) {
    // Create handle function
    const handle = function(event) {
      const handlers = handle.handlers;
      for(let i = 0; i < handlers.length; i++) {
        handlers[i](event);
      }
    }

    // Add handlers to handle
    handle.handlers = events[eventType];

    // Add handler to VNode
    events[eventType] = handle;

    // Add event listener
    node.addEventListener(eventType, handle);
  }
}

const createNode = function(vnode) {
  const type = vnode.type;
  let data = vnode.data;
  let node;

  if(type === "#text") {
    // Create textnode
    node = document.createTextNode(vnode.value);
  } else {
    let children = vnode.children;
    node = data.SVG === 1 ? document.createElementNS("http://www.w3.org/2000/svg", type) : document.createElement(type);

    // Append all children
    for(let i = 0; i < children.length; i++) {
      appendVNode(children[i], node);
    }

    // Add all event listeners
    const events = data.events;
    if(events !== undefined) {
      addEvents(node, events);
    }

    // Add Props
    patchProps(node, undefined, vnode, vnode.props);
  }

  // Hydrate
  data.node = node;

  return node;
}

const createComponent = function(node, vnode, component) {
  const props = component.options.props;
  const attrs = vnode.props.attrs;
  let componentProps = {};

  // Get component props
  if(props !== undefined && attrs !== undefined) {
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

const appendNode = function(node, parentNode) {
  parentNode.appendChild(node);
}

const appendVNode = function(vnode, parentNode) {
  const vnodeComponent = vnode.data.component;

  if(vnodeComponent === undefined) {
    appendNode(createNode(vnode), parentNode);
  } else {
    const root = document.createElement(vnode.type);
    appendNode(root, parentNode);
    createComponent(root, vnode, vnodeComponent);
  }
}

const removeNode = function(node, parentNode) {
  parentNode.removeChild(node);
}

const removeVNode = function(vnode, parentNode) {
  const vnodeData = vnode.data;
  const vnodeComponentInstance = vnodeData.component;

  if(vnodeComponentInstance !== undefined) {
    vnodeComponentInstance.destroy();
  }

  removeNode(vnodeData.node, parentNode);
}

const replaceNode = function(newNode, oldNode, parentNode) {
  parentNode.replaceChild(newNode, oldNode);
}

const replaceVNode = function(newVNode, oldVNode, parentNode) {
  const oldVNodeData = oldVNode.data;
  const oldVNodeComponentInstance = oldVNodeData.component;

  if(oldVNodeComponentInstance !== undefined) {
    oldVNodeComponentInstance.destroy();
  }

  const newVNodeComponent = newVNode.data.component;
  if(newVNodeComponent === undefined) {
    replaceNode(createNode(newVNode), oldVNodeData.node, parentNode);
  } else {
    createComponent(oldVNodeData.node, newVNode, newVNodeComponent);
  }
}
