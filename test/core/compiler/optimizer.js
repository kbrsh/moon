describe("Compiler Optimization", function() {
  it("should not rerender static nodes", function() {
    createTestElement("staticOptimization", "<div><p><span>Static</span></p></div>");

    var app = new Moon({
      root: "#staticOptimization"
    });

    expect(app.render()).to.equal(app.render());
  });

  it("should optimize on unknown HTML", function() {
    createTestElement("unknownHTMLOptimization", "<custom></custom>");

    var app = new Moon({
      root: "#unknownHTMLOptimization"
    });

    expect(app.render()).to.equal(app.render());
  });

  describe("If/Else Directives", function() {
    it("should optimize an if statement", function() {
      createTestElement("ifOptimization", "<div m-if='trueCondition'>True</div>");

      var app = new Moon({
        root: "#ifOptimization",
        data: {
          trueCondition: true
        }
      });

      expect(app.render().children[0]).to.equal(app.render().children[0]);
      expect(app.render().children[0].children[0]).to.equal(app.render().children[0].children[0]);
    });

    it("should optimize on if statements next to each other", function() {
      createTestElement("ifNextOptimization", "<div m-if='true'>True</div><div m-if='falseCondition'>False</div>");

      var app = new Moon({
        root: "#ifNextOptimization",
        data: {
          falseCondition: false
        }
      });

      expect(app.render().children[0]).to.equal(app.render().children[0]);
      expect(app.render().children[0].children[0]).to.equal(app.render().children[0].children[0]);

      app.set("falseCondition", true);

      expect(app.render().children[1]).to.equal(app.render().children[1]);
      expect(app.render().children[1].children[0]).to.equal(app.render().children[1].children[0]);
    });

    it("should optimize on if statements with the same parent seperated by an element", function() {
      createTestElement("ifSeperatedOptimization", "<div m-if='trueCondition'>True</div><h1>In the Middle.</h1><div m-if='trueCondition'>True</div>");

      var app = new Moon({
        root: "#ifSeperatedOptimization",
        data: {
          trueCondition: true
        }
      });

      expect(app.render().children[0]).to.equal(app.render().children[0]);
      expect(app.render().children[0].children[0]).to.equal(app.render().children[0].children[0]);

      expect(app.render().children[2]).to.equal(app.render().children[2]);
      expect(app.render().children[2].children[0]).to.equal(app.render().children[2].children[0]);
    });

    it("should optimize an if/else statement", function() {
      createTestElement("ifElseOptimization", "<div m-if='trueCondition'>True</div><div m-else>False</div>");

      var app = new Moon({
        root: "#ifElseOptimization",
        data: {
          trueCondition: true
        }
      });

      expect(app.render().children[0]).to.equal(app.render().children[0]);

      app.set("trueCondition", false);

      expect(app.render().children[0]).to.equal(app.render().children[0]);
    });
  });

  describe("For Directive", function() {
    createTestElement("forOptimizationStatic", "<div><h1 m-for='item in iteratable'>Static</h1></div>");
    createTestElement("forOptimizationDynamic", "<div><h1 m-for='item in iteratable'>{{item}}</h1></div>");

    var staticApp = new Moon({
      root: "#forOptimizationStatic",
      data: {
        iteratable: [1, 2, 3]
      }
    });

    var dynamicApp = new Moon({
      root: "#forOptimizationDynamic",
      data: {
        iteratable: [1, 2, 3]
      }
    });

    it("should optimize a static element", function() {
      var tree = staticApp.render();
      expect(tree.children[0].children[0]).to.not.equal(staticApp.render().children[0].children[0]);
      expect(tree.children[0].children[0].children[0]).to.equal(staticApp.render().children[0].children[0].children[0]);
    });

    it("should deoptimize a dynamic element", function() {
      expect(dynamicApp.render().children[0].children[0].children[0]).to.not.equal(dynamicApp.render().children[0].children[0].children[0]);
    });
  });

  describe("On Directive", function() {
    createTestElement("onOptimization", "<button m-on:click='staticMethod'>Click Me</button>");
    createTestElement("onOptimizationStaticParameters", "<button m-on:click='dynamicMethod(true)'>Click Me</button>");
    createTestElement("onOptimizationParameters", "<button m-on:click='dynamicMethod(prop)'>Click Me</button>");

    var methodApp = new Moon({
      root: "#onOptimization",
      methods: {
        staticMethod: function() {}
      }
    });

    var staticParamApp = new Moon({
      root: "#onOptimizationStaticParameters",
      methods: {
        dynamicMethod: function(prop) {}
      }
    });

    var paramApp = new Moon({
      root: "#onOptimizationParameters",
      data: {
        prop: "Dynamic"
      },
      methods: {
        dynamicMethod: function(prop) {}
      }
    });

    it("should optimize a method", function() {
      expect(methodApp.render()).to.equal(methodApp.render());
    });

    it("should optimize a method with static parameters", function() {
      expect(staticParamApp.render()).to.equal(staticParamApp.render());
    });

    it("should deoptimize a method with dynamic parameters", function() {
      expect(paramApp.render().children[0]).to.not.equal(paramApp.render().children[0]);
      expect(paramApp.render().children[0].children[0]).to.equal(paramApp.render().children[0].children[0]);
    });
  });

  describe("Bind Directive", function() {
    createTestElement("bindOptimizationStatic", "<input m-bind='msg'/>");
    createTestElement("bindOptimizationDynamic", "<input m-bind='msg[index]'/>");

    var staticApp = new Moon({
      root: "#bindOptimizationStatic",
      data: {
        msg: "Hello Moon!"
      }
    });

    var dynamicApp = new Moon({
      root: "#bindOptimizationDynamic",
      data: {
        msg: ["Hello Moon!"],
        index: 0
      }
    });

    it("should deoptimize a static model", function() {
      expect(staticApp.render().children[0]).to.not.equal(staticApp.render().children[0]);
    });

    it("should deoptimize a dynamic model", function() {
      expect(dynamicApp.render().children[0]).to.not.equal(dynamicApp.render().children[0]);
    });
  });

  describe("Literal Directive", function() {
    createTestElement("literalOptimizationStatic", "<h1 m-literal:prop='10'>Static</h1>");
    createTestElement("literalOptimizationDynamic", "<h1 m-literal:prop='msg'>Static</h1>");

    var staticApp = new Moon({
      root: "#literalOptimizationStatic",
    });

    var dynamicApp = new Moon({
      root: "#literalOptimizationDynamic",
      data: {
        msg: "Hello Moon!"
      }
    });

    it("should optimize a static literal property", function() {
      expect(staticApp.render()).to.equal(staticApp.render());
    });

    it("should deoptimize a dynamic literal property", function() {
      expect(dynamicApp.render().children[0]).to.not.equal(dynamicApp.render().children[0]);
      expect(dynamicApp.render().children[0].children[0]).to.equal(dynamicApp.render().children[0].children[0]);
    });
  });
});
