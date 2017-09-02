describe("Compiler Optimization", function() {
  it("should not rerender static nodes", function() {
    createTestElement("staticOptimization", "<h1><h2><h3><h4><h5><h6>Static</h6></h5></h4></h3></h2></h1>");

    var app = new Moon({
      root: "#staticOptimization"
    });

    var tree = app.render();
    var assertShouldRender = function(vnode) {
      expect(vnode.meta.shouldRender).to.equal(undefined);
      if(vnode.children !== undefined) {
        for(var i = 0; i < vnode.children.length; i++) {
          assertShouldRender(vnode.children[i]);
        }
      }
    }
    assertShouldRender(tree);
  });

  it("should deoptimize on unknown HTML", function() {
    createTestElement("unknownHTMLOptimization", "<custom></custom>");

    var app = new Moon({
      root: "#unknownHTMLOptimization"
    });

    expect(app.render().children[0].meta.shouldRender).to.equal(1);
  });

  it("should optimize an if statement", function() {
    createTestElement("ifOptimization", "<div m-if='trueCondition'>True</div>");

    var app = new Moon({
      root: "#ifOptimization",
      data: {
        trueCondition: true
      }
    });

    expect(app.render().children[0].meta.shouldRender).to.equal(1);
    expect(app.render().children[0].children[0].meta.shouldRender).to.equal(undefined);
  });

  it("should optimize on if statements next to each other", function() {
    createTestElement("ifNextOptimization", "<div m-if='true'>True</div><div m-if='falseCondition'>False</div>");

    var app = new Moon({
      root: "#ifNextOptimization",
      data: {
        falseCondition: false
      }
    });

    expect(app.render().children[0].meta.shouldRender).to.equal(1);
    expect(app.render().children[0].children[0].meta.shouldRender).to.equal(undefined);

    app.set("falseCondition", true);

    expect(app.render().children[1].meta.shouldRender).to.equal(1);
    expect(app.render().children[1].children[0].meta.shouldRender).to.equal(undefined);
  });

  it("should optimize on if statements with the same parent seperated by an element", function() {
    var l = createTestElement("ifSeperatedOptimization", "<div m-if='trueCondition'>True</div><h1>In the Middle.</h1><div m-if='trueCondition'>True</div>");

    var app = new Moon({
      root: "#ifSeperatedOptimization",
      data: {
        trueCondition: true
      }
    });

    expect(app.render().children[0].meta.shouldRender).to.equal(1);
    expect(app.render().children[0].children[0].meta.shouldRender).to.equal(undefined);

    expect(app.render().children[2].meta.shouldRender).to.equal(1);
    expect(app.render().children[2].children[0].meta.shouldRender).to.equal(undefined);
  });

  it("should deoptimize on an if/else statement", function() {
    createTestElement("ifElseOptimization", "<div m-if='trueCondition'>True</div><div m-else>False</div>");

    var app = new Moon({
      root: "#ifElseOptimization",
      data: {
        trueCondition: true
      }
    });

    expect(app.render().children[0].meta.shouldRender).to.equal(1);
    expect(app.render().children[0].children[0].meta.shouldRender).to.equal(1);

    app.set("trueCondition", false);

    expect(app.render().children[0].meta.shouldRender).to.equal(1);
    expect(app.render().children[0].children[0].meta.shouldRender).to.equal(1);
  });
});
