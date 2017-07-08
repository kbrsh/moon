describe("Component", function() {
  it("should create a constructor", function() {
    var componentConstructor = Moon.component("const", {template: "<div></div>"});
    expect(new componentConstructor()).to.be.an.instanceof(Moon);
  });

  it("should render HTML", function() {
    var component = createTestElement("component", "<component></component>");

    Moon.component("component", {
      template: "<h1>Hello Moon!</h1>"
    });

    new Moon({
      el: "#component"
    });

    return wait(function() {
      expect(component.firstChild.innerHTML).to.equal("Hello Moon!");
    });
  });

  describe("Data", function() {
    var componentData = createTestElement("componentData", "<component-data></component-data>");
    var h1 = null;
    var button = null;

    Moon.component("component-data", {
      template: "<div><h1>{{msg}}</h1><button m-on:click='change'></button></div>",
      data: function() {
        return {
          msg: "Hello Moon!"
        }
      },
      methods: {
        change: function() {
          this.set("msg", "Changed");
        }
      }
    });

    new Moon({
      el: "#componentData"
    });

    it("should render data from within the component state", function() {
      return wait(function() {
        h1 = componentData.firstChild.firstChild;
        button = h1.nextSibling;
        expect(h1.innerHTML).to.equal("Hello Moon!");
      });
    });

    it("should update when data is updated", function() {
      button.click();
      return wait(function() {
        expect(h1.innerHTML).to.equal("Changed");
      });
    });
  });

  describe("Props", function() {
    var componentProps = createTestElement("componentProps", "<component-props msg='{{msg}}'></component-props>");

    Moon.component("component-props", {
      template: "<h1>{{msg}}</h1>",
      props: ["msg"]
    });

    var app = new Moon({
      el: "#componentProps",
      data: {
        msg: "Hello Moon!"
      }
    });

    it("should render with props", function() {
      return wait(function() {
        expect(componentProps.firstChild.innerHTML).to.equal("Hello Moon!");
      });
    });

    it("should render when updated", function() {
      app.set("msg", "Changed");
      return wait(function() {
        expect(componentProps.firstChild.innerHTML).to.equal("Changed");
      });
    });
  });

  describe("Slots", function() {
    it("should render the default slot", function() {
      var defaultSlot = createTestElement("componentDefaultSlot", "<component-default-slot>Hello Moon!</component-default-slot>");

      Moon.component("component-default-slot", {
        template: "<h1><slot></slot></h1>"
      });

      new Moon({
        el: "#componentDefaultSlot"
      });

      return wait(function() {
        expect(defaultSlot.firstChild.nodeName.toLowerCase()).to.equal("h1");
        expect(defaultSlot.firstChild.innerHTML).to.equal("Hello Moon!");
      });
    });

    it("should render a named slot", function() {
      var namedSlot = createTestElement("componentNamedSlot", "<component-named-slot><span slot='named'>Hello Moon!</span></component-named-slot>");

      Moon.component("component-named-slot", {
        template: "<h1><slot name='named'></slot></h1>"
      });

      new Moon({
        el: "#componentNamedSlot"
      });

      return wait(function() {
        var h1 = namedSlot.firstChild;
        var span = h1.firstChild;
        expect(h1.nodeName.toLowerCase()).to.equal("h1");
        expect(span.nodeName.toLowerCase()).to.equal("span");
        expect(span.innerHTML).to.equal("Hello Moon!");
      });
    });
  });

  describe("Events from Children", function() {
    it("should listen to events from child components", function() {
      var childEvent = createTestElement("childEvent", "<p>{{total}}</p><counter m-on:increment='incrementTotal'></counter>");
      var p = childEvent.firstChild;
      var h1 = null;
      var button = null;

      var counter = Moon.component("counter", {
        template: "<div><h1>{{count}}</h1><button m-on:click='increment'>Increment</button></div>",
        data: function() {
          return {
            count: 0
          }
        },
        methods: {
          increment: function() {
            this.set("count", this.get("count") + 1);
            this.emit("increment");
          }
        }
      });

      new Moon({
        el: "#childEvent",
        data: {
          total: 0
        },
        methods: {
          incrementTotal: function() {
            this.set("total", this.get("total") + 1);
          }
        }
      });

      return wait(function(done) {
        h1 = p.nextSibling.firstChild;
        button = h1.nextSibling;

        button.click();
        
        Moon.nextTick(function() {
          expect(p.innerHTML).to.equal("1");
          expect(h1.innerHTML).to.equal("1");

          done();
        });
      });
    });
  });
});
