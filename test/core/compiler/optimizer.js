describe("Compiler Optimization", function() {
  it("should not rerender static nodes", function() {
    createTestElement("staticOptimization", "<h1><h2><h3><h4><h5><h6>Static</h6></h5></h4></h3></h2></h1>");

    var app = new Moon({
      el: "#staticOptimization"
    });

    var tree = app.render();
    var assertShouldRender = function(vnode) {
      expect(vnode.meta.shouldRender).to.equal(false);
      for(var i = 0; i < vnode.children.length; i++) {
        assertShouldRender(vnode.children[i]);
      }
    }
    assertShouldRender(tree);
  });
});
