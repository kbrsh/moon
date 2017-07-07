describe('Plugin', function() {
  var plugin = createTestElement("plugin", '<span m-empty>{{msg}}</span>');

  var emptyPlugin = {
    init: function(Moon) {
      Moon.directive('empty', function(el, val, vdom) {
        el.innerHTML = "";
        vdom.children[0].val = "";
      });
    }
  }

  Moon.use(emptyPlugin);

  var app = new Moon({
    el: "#plugin",
    data: {
      msg: "Hello Moon!"
    }
  });

  it('should execute', function() {
    expect(plugin.firstChild.innerHTML).to.equal("");
  });
});
