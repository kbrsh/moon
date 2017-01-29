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
 * Compiles a Template
 * @param {String} template
 * @param {Boolean} isString
 * @return {String} compiled template
 */
var compileTemplate = function(template, isString) {
  var TEMPLATE_RE = /{{([A-Za-z0-9_.()\[\]]+)}}/gi;
  var compiled = template;
  template.replace(TEMPLATE_RE, function(match, key) {
    if(isString) {
      compiled = compiled.replace(match, `" + this.get("${key}") + "`);
    } else {
      compiled = compiled.replace(match, `this.get("${key}")`);
    }
  });
  return compiled;
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
    meta: meta || {
      shouldRender: true
    }
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
  var children = args;
  for(var i = 0; i < children.length; i++) {
    if(typeof children[i] === "string" || children[i] === null) {
      children[i] = createElement("#text", children[i] || '', {}, [], null);
    }
  }
  return createElement(tag, children.join(""), attrs, children, null);
};

/**
 * Creates DOM Node from VNode
 * @param {Object} vnode
 * @return {Object} DOM Node
 */
var createNodeFromVNode = function(vnode) {
  var el;
  if(vnode.type === "#text") {
    el = document.createTextNode(vnode.val);
  } else {
    el = document.createElement(vnode.type);
    var children = vnode.children.map(createNodeFromVNode);
    for(var i = 0; i < children.length; i++) {
      el.appendChild(children[i]);
    }
  }
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
 */
var diff = function(node, vnode, parent) {
  var nodeName;

  if(node) {
    nodeName = node.nodeName.toLowerCase();
  }

  if(vnode && vnode.meta ? vnode.meta.shouldRender : true) {
    if(!node) {
      // No node, add it
      parent.appendChild(createNodeFromVNode(vnode));
    } else if(!vnode) {
      // No VNode, remove the node
      parent.removeChild(node);
    } else if(nodeName !== vnode.type) {
      // Different types of Nodes, replace the node
      parent.replaceChild(createNodeFromVNode(vnode), node);
    } else if(nodeName === "#text" && vnode.type === "#text") {
      // Both are text, set the text
      node.textContent = vnode.val;
    } else if(vnode.type) {
      // Diff properties
      var nodeProps = extractAttrs(node);
      diffProps(node, nodeProps, vnode.props, vnode);

      // Diff children
      for(var i = 0; i < vnode.children.length || i < node.childNodes.length; i++) {
        diff(node.childNodes[i], vnode.children[i], node);
      }
    }
  }
}


/**
 * Merges two Objects
 * @param {Object} obj
 * @param {Object} obj2
 * @return {Object} Merged Objects
 */
var merge = function(obj, obj2) {
  var merged = Object.create(obj);
  for (var key in obj2) {
    if (obj2.hasOwnProperty(key)) merged[key] = obj2[key];
  }
  return merged;
}

/**
 * Does No Operation
 */
var noop = function() {

}
