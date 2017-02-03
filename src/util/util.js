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
 * Converts attributes into key-value pairs
 * @param {Node} node
 * @return {Object} Key-Value pairs of Attributes
 */
var extractAttrs = function(node) {
  var attrs = {};
  if(!node.attributes) return attrs;
  var rawAttrs = node.attributes;
  for(var i = 0; i < rawAttrs.length; i++) {
    attrs[rawAttrs[i].name] = rawAttrs[i].value
  }

  return attrs;
}

/**
 * Gives Default Metadata for a VNode
 * @return {Object} metadata
 */
var defaultMetadata = function() {
  return {
    shouldRender: true,
    component: false,
    eventListeners: {}
  }
}

/**
 * Compiles a Template
 * @param {String} template
 * @param {Boolean} isString
 * @return {String} compiled template
 */
var compileTemplate = function(template, isString, customCode) {
  var TEMPLATE_RE = /{{([A-Za-z0-9_]+)([A-Za-z0-9_.()\[\]]+)?}}/gi;
  var compiled = template;
  template.replace(TEMPLATE_RE, function(match, key, modifiers) {
    if(!modifiers) {
      modifiers = '';
    }
    if(customCode) {
      compiled = customCode(compiled, match, key, modifiers);
    } else if(isString) {
      compiled = compiled.replace(match, `" + this.get("${key}")${modifiers} + "`);
    } else {
      compiled = compiled.replace(match, `this.get("${key}")${modifiers}`);
    }
  });
  return compiled;
}

/**
 * Creates an "h" Call for a VNode
 * @param {Object} vnode
 * @return {String} "h" call
 */
var createCall = function(vnode) {
  return `h("${vnode.type}", ${JSON.stringify(vnode.props)}, ${JSON.stringify(vnode.meta)}, ${vnode.children.join(",") || null})`
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
 * Compiles Arguments to a VNode
 * @param {String} tag
 * @param {Object} attrs
 * @param {Array} children
 * @return {String} Object usable in Virtual DOM (VNode)
 */
var h = function() {
  var args = Array.prototype.slice.call(arguments);
  var tag = args.shift();
  var attrs = args.shift() || {};
  var meta = args.shift() || defaultMetadata();
  var children = [];
  for(var i = 0; i < args.length; i++) {
    var arg = args[i];
    if(Array.isArray(arg)) {
      children = children.concat(arg);
    } else if(typeof args[i] === "string" || args[i] === null) {
      children.push(createElement("#text", args[i] || '', {}, [], meta));
    } else {
      children.push(arg);
    }
  }

  return createElement(tag, children.join(""), attrs, children, meta);
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
      if(method === "__MOON__MODEL__UPDATE__") {
        node.addEventListener("input", function(evt) {
          instance.set(vnode.props["m-model"], evt.target.value);
        });
        return;
      }
      if(instance.$events[type]) {
        instance.on(type, function() {
          instance.callMethod(method, [e]);
        });
      } else {
        node.addEventListener(type, function(e) {
          instance.callMethod(method, [e]);
        });
      }
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
    el = document.createTextNode(vnode.val);
  } else {
    el = document.createElement(vnode.type);
    var children = vnode.children.map(function(item) {
      return createNodeFromVNode(item, instance);
    });
    for(var i = 0; i < children.length; i++) {
      el.appendChild(children[i]);
    }
    addEventListeners(el, vnode, instance);
  }
  diffProps(el, {}, vnode.props, vnode);
  return el;
}

/**
 * Diffs Props of Node and a VNode, and apply Changes
 * @param {Object} node
 * @param {Object} nodeProps
 * @param {Object} vnodeProps
 * @param {Object} vnode
 */
var diffProps = function(node, nodeProps, vnodeProps, vnode) {
  // Get object of all properties being compared
  var allProps = merge(nodeProps, vnodeProps);

  for(var propName in allProps) {
    // If not in VNode or is Directive, remove it
    if(!vnodeProps[propName] || directives[propName] || specialDirectives[propName]) {
      // If it is a directive, run the directive
      if(directives[propName]) {
        directives[propName](node, allProps[propName], vnode);
      }
      node.removeAttribute(propName);
    } else if(!nodeProps[propName] || nodeProps[propName] !== vnodeProps[propName]) {
      // It has changed or is not in the node in the first place
      node.setAttribute(propName, vnodeProps[propName]);
    }
  }
}

/**
 * Diffs Node and a VNode, and applies Changes
 * @param {Object} node
 * @param {Object} vnode
 * @param {Object} parent
 * @param {Object} instance
 */
var diff = function(node, vnode, parent, instance) {
  var nodeName;

  if(node) {
    nodeName = node.nodeName.toLowerCase();
  }

  if(vnode && vnode.meta ? vnode.meta.shouldRender : true) {

    if(!node) {
      // No node, add it
      parent.appendChild(createNodeFromVNode(vnode, instance));
    } else if(!vnode) {
      // No VNode, remove the node
      parent.removeChild(node);
    } else if(nodeName !== vnode.type) {
      // Different types of Nodes, replace the node
      parent.replaceChild(createNodeFromVNode(vnode, instance), node);
    } else if(nodeName === "#text" && vnode.type === "#text") {
      // Both are text, set the text
      node.textContent = vnode.val;
    } else if(vnode.type) {
      // Diff properties
      var nodeProps = extractAttrs(node);
      diffProps(node, nodeProps, vnode.props, vnode);

      if(instance.$initialRender) {
        addEventListeners(node, vnode, instance);
      }

      // Diff children
      for(var i = 0; i < vnode.children.length || i < node.childNodes.length; i++) {
        diff(node.childNodes[i], vnode.children[i], node, instance);
      }
    }

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
    hook();
  }
}

/**
 * Does No Operation
 */
var noop = function() {

}
