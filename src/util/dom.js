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
      appendChild(children[i], node);
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

const appendChild = function(vnode, parent) {
  const component = vnode.data.component;

  if(component === undefined) {
    parent.appendChild(createNode(vnode));
  } else {
    const root = document.createElement(vnode.type);
    parent.appendChild(root);
    createComponent(root, vnode, component);
  }
}
