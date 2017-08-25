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

  it("should deoptimize on unknown HTML", function() {
    createTestElement("unknownHTMLOptimization", "<custom></custom>");

    var app = new Moon({
      el: "#unknownHTMLOptimization"
    });

    expect(app.render().children[0].meta.shouldRender).to.equal(true);
  });

  it("should optimize an if statement", function() {
    createTestElement("ifOptimization", "<div m-if='trueCondition'>True</div>");

    var app = new Moon({
      el: "#ifOptimization",
      data: {
        trueCondition: true
      }
    });

    expect(app.render().children[0].meta.shouldRender).to.equal(true);
    expect(app.render().children[0].children[0].meta.shouldRender).to.equal(false);
  });

  it("should deoptimize on if statements next to each other", function() {
    createTestElement("ifNextOptimization", "<div m-if='true'>True</div><div m-if='falseCondition'>False</div>");

    var app = new Moon({
      el: "#ifNextOptimization",
      data: {
        falseCondition: false
      }
    });

    expect(app.render().children[0].meta.shouldRender).to.equal(true);
    expect(app.render().children[0].children[0].meta.shouldRender).to.equal(true);

    app.set("falseCondition", true);

    expect(app.render().children[1].meta.shouldRender).to.equal(true);
    expect(app.render().children[1].children[0].meta.shouldRender).to.equal(true);
  });

  it("should optimize on if statements with the same parent seperated by an element", function() {
    var l = createTestElement("ifSeperatedOptimization", "<div m-if='trueCondition'>True</div><h1>In the Middle.</h1><div m-if='trueCondition'>True</div>");

    var app = new Moon({
      el: "#ifSeperatedOptimization",
      data: {
        trueCondition: true
      }
    });

    expect(app.render().children[0].meta.shouldRender).to.equal(true);
    expect(app.render().children[0].children[0].meta.shouldRender).to.equal(false);

    expect(app.render().children[2].meta.shouldRender).to.equal(true);
    expect(app.render().children[2].children[0].meta.shouldRender).to.equal(false);
  });

  it("should deoptimize on an if/else statement", function() {
    createTestElement("ifElseOptimization", "<div m-if='trueCondition'>True</div><div m-else>False</div>");

    var app = new Moon({
      el: "#ifElseOptimization",
      data: {
        trueCondition: true
      }
    });

    expect(app.render().children[0].meta.shouldRender).to.equal(true);
    expect(app.render().children[0].children[0].meta.shouldRender).to.equal(true);

    app.set("trueCondition", false);

    expect(app.render().children[0].meta.shouldRender).to.equal(true);
    expect(app.render().children[0].children[0].meta.shouldRender).to.equal(true);
  });
});
