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
 * Compiles JSX to Virtual DOM
 * @param {String} tag
 * @param {Object} attrs
 * @param {Array} children
 * @return {String} Object usable in Virtual DOM
 */
var h = function() {
  var args = Array.prototype.slice.call(arguments);
  var tag = args.shift();
  var attrs = args.shift() || {};
  var children = args;
  return createElement(tag, children.join(""), attrs, children, null);
};

/**
 * Creates DOM Node from VNode
 * @param {Object} vnode
 * @return {Object} DOM Node
 */
var createNodeFromVNode = function(vnode) {
  var el;
  if(typeof vnode === "string") {
    el = document.createTextNode(vnode);
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
 * Diffs Node and a VNode, and applys Changes
 * @param {Object} node
 * @param {Object} vnode
 * @param {Object} parent
 */

var diffProps = function(node, nodeProps, vnodeProps) {
  // Get object of all properties being compared
  var allProps = merge(nodeProps, vnodeProps);

  for(var propName in allProps) {
    if(!vnodeProps[propName] || directives[propName]) {
      node.removeAttribute(propName);
    } else if(!nodeProps[propName] || nodeProps[propName] !== vnodeProps[propName]) {
      node.setAttribute(propName, vnodeProps[propName]);
    }
  }
}

/**
 * Diffs Node and a VNode, and applys Changes
 * @param {Object} node
 * @param {Object} vnode
 * @param {Object} parent
 */
var diff = function(node, vnode, parent) {
  var nodeName;

  if(node) {
    nodeName = node.nodeName.toLowerCase();
  }

  if(vnode === null) {
    vnode = '';
  }

  if(!node) {
    parent.appendChild(createNodeFromVNode(vnode));
  } else if(!vnode) {
    parent.removeChild(node);
  } else if(nodeName !== (vnode.type || "#text")) {
    parent.replaceChild(createNodeFromVNode(vnode), node);
  } else if(nodeName === "#text" && typeof vnode === "string") {
    node.textContent = vnode;
  } else if(vnode.type) {
    var nodeProps = extractAttrs(node);

    diffProps(node, nodeProps, vnode.props);

    nodeProps = extractAttrs(node);
    for(var propName in nodeProps) {
      if(directives[propName]) {
        directives[propName](node, nodeProps[propName], vnode);
      }
    }

    for(var i = 0; i < vnode.children.length || i < node.childNodes.length; i++) {
      diff(node.childNodes[i], vnode.children[i], node);
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
