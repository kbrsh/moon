/* ======= Instance Methods ======= */

/**
* Logs a Message
* @param {String} msg
*/
Moon.prototype.log = function(msg) {
  if(!config.silent) console.log(msg);
}

/**
* Throws an Error
* @param {String} msg
*/
Moon.prototype.error = function(msg) {
  console.log("Moon ERR: " + msg);
}

/**
* Creates an object to be used in a Virtual DOM
* @param {String} type
* @param {Array} children
* @param {String} val
* @param {Object} props
* @param {Node} node
* @return {Object} Object usable in Virtual DOM
*/
Moon.prototype.createElement = function(type, children, val, props, node) {
  return {type: type, children: children, val: val, props: props, node: node};
}

/**
* Create Elements Recursively For all Children
* @param {Array} children
* @return {Array} Array of elements usable in Virtual DOM
*/
Moon.prototype.recursiveChildren = function(children) {
  var recursiveChildrenArr = [];
  for(var i = 0; i < children.length; i++) {
    var child = children[i];
    recursiveChildrenArr.push(this.createElement(child.nodeName, this.recursiveChildren(child.childNodes), child.textContent, extractAttrs(child), child));
  }
  return recursiveChildrenArr;
}

/**
* Creates Virtual DOM
* @param {Node} node
*/
Moon.prototype.createVirtualDOM = function(node) {
  var vdom = this.createElement(node.nodeName, this.recursiveChildren(node.childNodes), node.textContent, extractAttrs(node), node);
  this.$dom = vdom;
}

/**
* Sets Value in Data
* @param {String} key
* @param {String} val
*/
Moon.prototype.set = function(key, val) {
  this.$data[key] = val;
  if(!this.$destroyed) this.build(this.$dom.children);
  if(this.$hooks.updated) {
    this.$hooks.updated();
  }
}

/**
* Gets Value in Data
* @param {String} key
* @return {String} Value of key in data
*/
Moon.prototype.get = function(key) {
  return this.$data[key];
}

/**
* Calls a method
* @param {String} method
*/
Moon.prototype.method = function(method) {
  this.$methods[method]();
}

/**
* Destroys Moon Instance
*/
Moon.prototype.destroy = function() {
  Object.defineProperty(this, '$data', {
    set: function(value) {
      _data = value;
    }
  });
  this.$destroyed = true;
  if(this.$hooks.destroyed) this.$hooks.destroyed();
}

/**
* Builds the DOM With Data
* @param {Array} children
*/
Moon.prototype.build = function(children) {
  for(var i = 0; i < children.length; i++) {
    var el = children[i];

    if(el.type === "#text") {
      el.node.textContent = compileTemplate(el.val, this.$data);
    } else if(el.props) {
      for(var prop in el.props) {
        var propVal = el.props[prop];
        var compiledProperty = compileTemplate(propVal, this.$data);
        var directive = directives[prop];
        if(directive) {
          el.node.removeAttribute(prop);
          directive(el.node, compiledProperty, el);
        }

        if(!directive) el.node.setAttribute(prop, compiledProperty);
      }
    }

    this.build(el.children);
  }
}

/**
* Initializes Moon
*/
Moon.prototype.init = function() {
  this.log("======= Moon =======");
  if(this.$hooks.created) {
    this.$hooks.created();
  }
  this.createVirtualDOM(this.$el);
  this.build(this.$dom.children);
  if(this.$hooks.mounted) {
    this.$hooks.mounted();
  }
}
