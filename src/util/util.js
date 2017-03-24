/* ======= Global Utilities ======= */

/**
 * Logs a Message
 * @param {String} msg
 */
var log = function(msg) {
  if(!Moon.config.silent) console.log(msg);
}

/**
 * Throws an Error
 * @param {String} msg
 */
var error = function(msg) {
  console.error("[Moon] ERR: " + msg);
}

/**
 * Adds DOM Updates to Queue
 * @param {Object} instance
 */
var queueBuild = function(instance) {
  if(!instance.$queued && !instance.$destroyed) {
    instance.$queued = true;
    setTimeout(function() {
      instance.build();
      instance.$observer.dep.changed = {};
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
var extractAttrs = function(node) {
  var attrs = {};
  for(var rawAttrs = node.attributes, i = rawAttrs.length; i--;) {
    attrs[rawAttrs[i].name] = rawAttrs[i].value;
  }
  node.__moon__props__ = attrs;
  return attrs;
}

/**
 * Gives Default Metadata for a VNode
 * @return {Object} metadata
 */
var defaultMetadata = function() {
  return {
    shouldRender: true,
    eventListeners: {}
  }
}

/**
 * Escapes a String
 * @param {String} str
 */
var escapeString = function(str) {
	var NEWLINE_RE = /\n/g;
	var DOUBLE_QUOTE_RE = /"/g;
  var BACKSLASH_RE = /\\/g;
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
var resolveKeyPath = function(instance, obj, keypath, val) {
  var i;
  keypath.replace(/\[(\w+)\]/g, function(match, index) {
    keypath = keypath.replace(match, `.${index}`);
  });
  var path = keypath.split(".");
  for(i = 0; i < path.length - 1; i++) {
    var propName = path[i];
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
var compileTemplate = function(template, isString) {
  var TEMPLATE_RE = /{{([A-Za-z0-9_$@]+)([A-Za-z0-9_.()'"+\-*/\s\[\]]+)?}}/gi;
  var compiled = template;
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
var getSlots = function(children) {
  var slots = {};

  // No Children Means No Slots
  if(!children) {
    return slots;
  }

  var defaultSlotName = "default";
  slots[defaultSlotName] = [];

  for(var i = 0; i < children.length; i++) {
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
var createElement = function(type, val, props, children, meta) {
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
var createFunctionalComponent = function(type, props, meta, children, functionalComponent) {
  var data = functionalComponent.opts.data || {};
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
 * @param {...Object|String} children
 * @return {String} Object usable in Virtual DOM (VNode)
 */
var h = function(tag, attrs, meta) {
  // Setup Children
  var children = []
  var childrenLen = arguments.length - 3;
  for(var i = 0; i < childrenLen; i++) {
    var child = arguments[i + 3];
    if(Array.isArray(child)) {
      children = children.concat(child);
    } else if(typeof child === "string" || child === null) {
      children.push(createElement("#text", child || "", {attrs: {}}, [], defaultMetadata()));
    } else {
      children.push(child);
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
var addEventListeners = function(node, vnode, instance) {
  var eventListeners = vnode.meta.eventListeners;
  for(var type in eventListeners) {
    for(var i = 0; i < eventListeners[type].length; i++) {
      var method = eventListeners[type][i];
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
var createNodeFromVNode = function(vnode, instance) {
  var el;

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
        var childVNode = vnode.children[i];
        var childNode = createNodeFromVNode(vnode.children[i], instance);
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
  // Setup Props (With Cache)
  el.__moon__props__ = extend({}, vnode.props.attrs);
  diffProps(el, {}, vnode, vnode.props.attrs);

  // Setup Cached NodeName
  el.__moon__nodeName__ = vnode.type;
  return el;
}

/**
 * Mounts a Component To The DOM
 * @param {Object} node
 * @param {Object} vnode
 * @param {Object} component
 * @return {Object} DOM Node
 */
var createComponentFromVNode = function(node, vnode, component) {
  var componentInstance = new component.CTor();
  // Merge data with provided props
  for(var i = 0; i < componentInstance.$props.length; i++) {
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
var diffProps = function(node, nodeProps, vnode, vnodeProps) {
  // Get object of all properties being compared
  var allProps = merge(nodeProps, vnodeProps);

  // If node is svg, update with SVG namespace
  var isSVG = node instanceof SVGElement;

  for(var propName in allProps) {
    // If not in VNode or is a Directive, remove it
    if(!vnodeProps.hasOwnProperty(propName) || directives[propName]) {
      // If it is a directive, run the directive
      if(directives[propName]) {
        directives[propName](node, allProps[propName], vnode);
      }
      isSVG ? node.removeAttributeNS(null, propName) : node.removeAttribute(propName);
      delete node.__moon__props__[propName];
    } else if(!nodeProps[propName] || nodeProps[propName] !== vnodeProps[propName]) {
      // It has changed or is not in the node in the first place
      isSVG ? node.setAttributeNS(null, propName, vnodeProps[propName]) : node.setAttribute(propName, vnodeProps[propName]);
      node.__moon__props__[propName] = vnodeProps[propName];
    }
  }

  if(vnode.props.dom) {
    for(var domProp in vnode.props.dom) {
      var domPropValue = vnode.props.dom[domProp];
      if(node[domProp] !== vnode.props.dom[domProp]) {
        node[domProp] = vnode.props.dom[domProp];
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
var diff = function(node, vnode, parent, instance) {
  var nodeName;

  if(node) {
    nodeName = node.__moon__nodeName__ || node.nodeName.toLowerCase();
  }

  if(!node && vnode) {
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
      createComponentFromVNode(newNode, vnode, vnode.meta.component);
    }
    return newNode;
  } else if(vnode.meta.shouldRender && vnode.type === "#text" && nodeName === "#text" && vnode.val !== node.textContent) {
    // Both are textnodes, update the node
    node.textContent = vnode.val;
    return node;
  } else if(vnode && vnode.type !== "#text" && vnode.meta.shouldRender) {

    if(vnode.meta.component) {
      if(!node.__moon__) {
        // Not mounted, create a new instance and mount it here
        createComponentFromVNode(node, vnode, vnode.meta.component)
      } else {
        // Mounted already, need to update
        var componentInstance = node.__moon__;
        var componentChanged = false;
        // Merge any properties that changed
        for(var prop in vnode.props.attrs) {
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
      // Skip diffing any children
      return node;
    }

    // Children May have Changed

    // Diff props
    var nodeProps = node.__moon__props__ || extractAttrs(node);
    diffProps(node, nodeProps, vnode, vnode.props.attrs);

    // Add initial event listeners (done once)
    if(instance.$initialRender) {
      addEventListeners(node, vnode, instance);
    }

    // Check if innerHTML was changed, don't diff children
    if(vnode.props.dom && vnode.props.dom.innerHTML) {
      return node;
    }

    // Diff Children
    var currentChildNode = node.firstChild;
    // Optimization:
    //  If the vnode contains just one text vnode, create it here
    if(vnode.children.length === 1 && vnode.children[0].type === "#text" && currentChildNode && !currentChildNode.nextSibling && currentChildNode.nodeName === "#text") {
      if(vnode.children[0].val !== currentChildNode.textContent) {
        currentChildNode.textContent = vnode.children[0].val;
      }
    } else {
      // Iterate through all children
      for(var i = 0; i < vnode.children.length || currentChildNode; i++) {
        var next = currentChildNode ? currentChildNode.nextSibling : null;
        diff(currentChildNode, vnode.children[i], node, instance);
        currentChildNode = next;
      }
    }

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
var extend = function(parent, child) {
  for (var key in child) {
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
var merge = function(parent, child) {
  var merged = {};
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
var callHook = function(instance, name) {
  var hook = instance.$hooks[name];
  if(hook) {
    hook.call(instance);
  }
}

/**
 * Does No Operation
 */
var noop = function() {

}
