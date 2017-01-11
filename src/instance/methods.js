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
  this.$hooks.destroyed();
}

/**
* Builds the DOM With Data
* @param {Array} children
*/
Moon.prototype.build = function(children) {
  for(var i = 0; i < children.length; i++) {
    var vnode = this.$dom[i];
    var child = children[i];

    if(child.nodeName === "#text") {
      child.textContent = compileTemplate(vnode.template);
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
  this.build(this.$el.childNodes);
  this.$hooks.mounted();
}
