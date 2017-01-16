/* ======= Instance Methods ======= */

var hasConsole = typeof window.console !== undefined;

/**
* Logs a Message
* @param {String} msg
*/
Moon.prototype.log = function(msg) {
  if(!config.silent && hasConsole) console.log(msg);
}

/**
* Throws an Error
* @param {String} msg
*/
Moon.prototype.error = function(msg) {
  if(hasConsole) console.error("[Moon] ERR: " + msg);
}

/**
* Sets Value in Data
* @param {String} key
* @param {String} val
*/
Moon.prototype.set = function(key, val) {
  this.$data[key] = val;
  if(!this.$destroyed) this.build(this.$dom.children);
  this.$hooks.updated();
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
Moon.prototype.callMethod = function(method, args) {
  args = args || [];
  this.$methods[method].apply(this, args);
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
  this.$hooks.destroyed();
}

/**
* Builds the DOM With Data
* @param {Array} children
*/
Moon.prototype.build = function(vdom) {
  for(var i = 0; i < vdom.length; i++) {
    var vnode = vdom[i];
    if(vnode.shouldRender && !vnode.meta.once) {
      if(vnode.type === "#text") {
        var valueOfVNode = "";
        valueOfVNode = vnode.val(this.$data);
        vnode.node.textContent = valueOfVNode;
      } else if(vnode.props) {
        for(var attr in vnode.props) {
          var compiledProp = vnode.props[attr](this.$data);
          if(directives[attr]) {
            vnode.node.removeAttribute(attr);
            directives[attr](vnode.node, compiledProp, vnode);
          } else {
            vnode.node.setAttribute(attr, compiledProp);
          }
        }
      }

      this.build(vnode.children);
    }
  }
}

/**
* Initializes Moon
*/
Moon.prototype.init = function() {
  this.log("======= Moon =======");
  this.$hooks.created();

  setInitialElementValue(this.$el, this.$template);

  this.$dom = createVirtualDOM(this.$el);

  this.build(this.$dom.children);
  this.$hooks.mounted();
}
