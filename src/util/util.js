/* ======= Global Utilities ======= */

/**
 * Logs a Message
 * @param {String} msg
 */
const log = function(msg) {
  if(!Moon.config.silent) console.log(msg);
}

/**
 * Throws an Error
 * @param {String} msg
 */
const error = function(msg) {
  if(!Moon.config.silent) console.error("[Moon] ERR: " + msg);
}

/**
 * Adds DOM Updates to Queue
 * @param {Object} instance
 */
const queueBuild = function(instance) {
  if(!instance.$queued && !instance.$destroyed) {
    instance.$queued = true;
    setTimeout(function() {
      instance.build();
      callHook(instance, 'updated');
      instance.$queued = false;
    }, 0);
  }
}

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
 * Gives Default Metadata for a VNode
 * @return {Object} metadata
 */
const defaultMetadata = function() {
  return {
    shouldRender: true,
    eventListeners: {}
  }
}

/**
 * Escapes a String
 * @param {String} str
 */
const escapeString = function(str) {
	const NEWLINE_RE = /\n/g;
	const DOUBLE_QUOTE_RE = /"/g;
  const BACKSLASH_RE = /\\/g;
  return str.replace(BACKSLASH_RE, "\\\\").replace(DOUBLE_QUOTE_RE, "\\\"").replace(NEWLINE_RE, "\\n");
}

/**
 * Resolves an Object Keypath and Sets it
 * @param {Object} instance
 * @param {Object} obj
 * @param {String} keypath
 * @param {String} val
 * @return {Object} resolved object
 */
const resolveKeyPath = function(instance, obj, keypath, val) {
  let i = null;
  keypath.replace(/\[(\w+)\]/g, function(match, index) {
    keypath = keypath.replace(match, `.${index}`);
  });
  var path = keypath.split(".");
  for(i = 0; i < path.length - 1; i++) {
    const propName = path[i];
    obj = obj[propName];
  }
  obj[path[i]] = val;
  return path[0];
}

/**
 * Compiles a Template
 * @param {String} template
 * @param {Boolean} isString
 * @return {String} compiled template
 */
const compileTemplate = function(template, isString) {
  const TEMPLATE_RE = /{{([A-Za-z0-9_$@]+)([A-Za-z0-9_.()'"+\-*/\s\[\]]+)?}}/gi;
  let compiled = template;
  template.replace(TEMPLATE_RE, function(match, key, modifiers) {
    if(!modifiers) {
      modifiers = '';
    }
    if(isString) {
      compiled = compiled.replace(match, `" + instance.get("${key}")${modifiers} + "`);
    } else {
      compiled = compiled.replace(match, `instance.get("${key}")${modifiers}`);
    }
  });
  return compiled;
}

/**
 * Extracts the Slots From Component Children
 * @param {Array} children
 * @return {Object} extracted slots
 */
const getSlots = function(children) {
  let slots = {};

  // No Children Means No Slots
  if(!children) {
    return slots;
  }

  let defaultSlotName = "default";
  slots[defaultSlotName] = [];

  for(let i = 0; i < children.length; i++) {
    var child = children[i];
    var childProps = child.props.attrs;
    if(childProps.slot) {
      if(!slots[childProps.slot]) {
        slots[childProps.slot] = [child];
      } else {
        slots[childProps.slot].push(child);
      }
      delete childProps.slot;
    } else {
      slots[defaultSlotName].push(child);
    }
  }

  return slots;
}

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

  // Setup Cache (Hydrate)
  el.__moon__vnode__ = vnode;

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
  return componentInstance.$el;
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
      if(!nodeProps.hasOwnProperty(vnodePropName) || nodeProps[vnodePropName] !== vnodeProps[vnodePropName]) {
        isSVG ? node.setAttributeNS(null, vnodePropName, vnodeProps[vnodePropName]) : node.setAttribute(vnodePropName, vnodeProps[vnodePropName]);
      }
    }
  }

  // Diff Node Props with VNode Props
  if(nodeProps) {
    for(let nodePropName in nodeProps) {
      if(!vnodeProps.hasOwnProperty(nodePropName) || directives[nodePropName]) {
        if(directives[nodePropName]) {
          directives[nodePropName](node, vnodeProps[nodePropName], vnode);
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
 * Diffs Node and a VNode, and applies Changes
 * @param {Object} node
 * @param {Object} vnode
 * @param {Object} parent
 * @param {Object} instance
 * @return {Object} adjusted node only if it was replaced
 */
const diff = function(node, vnode, parent, instance) {
  let nodeName = null;
  let oldVNode = null;
  let hydrating = false;

  if(node && vnode) {
    oldVNode = node.__moon__vnode__;
    hydrating = !oldVNode;
    if(hydrating) {
      nodeName = node.nodeName.toLowerCase();
    } else {
      nodeName = oldVNode.type;
    }
  }

  if(!node) {
    // No Node, create a node
    var newNode = createNodeFromVNode(vnode, instance);
    parent.appendChild(newNode);
    if(vnode.meta.component) {
      // Detected parent component, build it here (parent node is available)
      createComponentFromVNode(newNode, vnode, vnode.meta.component);
    }
    return newNode;
  } else if(!vnode) {
    // No vnode, remove the node
    parent.removeChild(node);

    // Check for Component
    if(node.__moon__) {
      // Component was unmounted, destroy it here
      node.__moon__.destroy();
    }

    return null;
  } else if(nodeName !== vnode.type) {
    // Different types, replace it
    var newNode = createNodeFromVNode(vnode, instance);
    parent.replaceChild(newNode, node);
    if(node.__moon__) {
      // Component was unmounted, destroy it here
      node.__moon__.destroy();
    }
    if(vnode.meta.component) {
      // Detected parent component, build it here (parent node is available)
      createComponentFromVNode(newNode, vnode, vnode.meta.component, hydrating);
    }
    return newNode;
  } else if(vnode.meta.shouldRender && vnode.type === "#text") {
    if(node && nodeName === "#text") {
      // Both are textnodes, update the node
      if(hydrating) {
        if(node.textContent !== vnode.val) {
          node.nodeValue = vnode.val;
        }
      } else {
        if(vnode.val !== oldVNode.val) {
          node.nodeValue = vnode.val;
        }
      }

      // Update Cache (Hydrate)
      node.__moon__vnode__ = vnode;
    } else {
      // Node isn't text, replace with one
      parent.replaceChild(createNodeFromVNode(vnode, instance), node);
    }

    return node;
  } else if(vnode.meta.shouldRender) {

    if(vnode.meta.component) {
      if(!node.__moon__) {
        // Not mounted, create a new instance and mount it here
        createComponentFromVNode(node, vnode, vnode.meta.component)
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

        // Cache VNode (Hydrate)
        node.__moon__vnode__ = vnode;
      }

      // Skip diffing any children
      return node;
    }

    // Children May have Changed

    // Diff props
    var nodeProps = hydrating ? extractAttrs(node) : oldVNode.props.attrs;
    diffProps(node, nodeProps, vnode, vnode.props.attrs);

    // Add initial event listeners (done once)
    if(instance.$initialRender) {
      addEventListeners(node, vnode, instance);
    }

    // Check if innerHTML was changed, don't diff children
    if(vnode.props.dom && vnode.props.dom.innerHTML) {
      // Cache VNode (Hydrate)
      node.__moon__vnode__ = vnode;

      // Exit
      return node;
    }

    // Diff Children
    if(!hydrating && vnode.children.length === 1 && vnode.children[0].type === "#text" && oldVNode.children.length === 1 && oldVNode.children[0].type === "#text") {
      // Optimization:
      //  If the vnode contains just one text vnode, create/update it here
      if(vnode.children[0].val !== oldVNode.children[0].val) {
        // Set Content
        node.textContent = vnode.children[0].val;

        // Cache VNodes (Hydrate)
        node.firstChild.__moon__vnode__ = vnode.children[0];
      }
    } else {
      // Just Iterate through All Children
      var i = 0;
      let currentChildNode = node.firstChild;
      let vchild = vnode.children[i];
      while(vchild || currentChildNode) {
        diff(currentChildNode, vchild, node, instance);
        vchild = vnode.children[++i];
        currentChildNode = currentChildNode && currentChildNode.nextSibling;
      }
    }

    // Cache VNode
    node.__moon__vnode__ = vnode;

    // Exit
    return node;
  } else {
    // Nothing Changed
    return node;
  }
}


/**
 * Extends an Object with another Object's properties
 * @param {Object} parent
 * @param {Object} child
 * @return {Object} Extended Parent
 */
const extend = function(parent, child) {
  for(let key in child) {
    parent[key] = child[key];
  }
  return parent;
}

/**
 * Merges Two Objects Together
 * @param {Object} parent
 * @param {Object} child
 * @return {Object} Merged Object
 */
const merge = function(parent, child) {
  let merged = {};
  for(var key in parent) {
    merged[key] = parent[key];
  }
  for (var key in child) {
    merged[key] = child[key];
  }
  return merged;
}

/**
 * Calls a Hook
 * @param {Object} instance
 * @param {String} name
 */
const callHook = function(instance, name) {
  const hook = instance.$hooks[name];
  if(hook) {
    hook.call(instance);
  }
}

/**
 * Does No Operation
 */
const noop = function() {

}
