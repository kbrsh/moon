describe("Functional Component", function() {
  it("should render HTML", function() {
    var functional = createTestElement("functional", "<functional-component></functional-component>");

    Moon.component("functional-component", {
      functional: true,
      render: function(m, ctx) {
        return m("h1", {attrs: {}}, {shouldRender: true}, []);
      }
    });

    new Moon({
      el: "#functional"
    });

    return wait(function() {
      expect(functional.firstChild.nodeName.toLowerCase()).to.equal("h1");
    });
  });

  describe("Props", function() {
    var functionalProps = createTestElement("functionalProps", "<functional-component-props someprop='{{parentMsg}}'></functional-component-props>");

    Moon.component("functional-component-props", {
      functional: true,
      props: ["someprop"],
      render: function(m, ctx) {
        return m("h1", {attrs: {}}, {shouldRender: true}, [
          m("#text", {shouldRender: true}, ctx.data.someprop)
        ]);
      }
    });

    var app = new Moon({
      el: "#functionalProps",
      data: {
        parentMsg: "Hello Moon!"
      }
    });

    it("should render with props", function() {
      return wait(function() {
        expect(functionalProps.firstChild.innerHTML).to.equal("Hello Moon!");
      });
    });

    it("should render when props are updated", function() {
      app.set("parentMsg", "Changed");

      return wait(function() {
        expect(functionalProps.firstChild.innerHTML).to.equal("Changed");
      });
    });
  });

  describe("Slots", function() {
    var functionalSlots = createTestElement("functionalSlots", '<functional-component-slots>Default Slot Content<span slot="named">Named Slot Content</span></functional-component-slots>');

    Moon.component("functional-component-slots", {
      functional: true,
      render: function(m, ctx) {
        return m("div", {attrs: {}}, {shouldRender: true}, [
          m("h1", {}, {shouldRender: true}, ctx.slots["default"]),
          m("h1", {attrs: {}}, {shouldRender: true}, ctx.slots.named)
        ]);
      }
    });

    new Moon({
      el: "#functionalSlots"
    });

    var h1 = null,
      h1_2 = null;

    it("should render the default slot", function() {
      return wait(function() {
        h1 = functionalSlots.firstChild.firstChild;
        expect(h1.innerHTML).to.equal("Default Slot Content");
      });
    });

    it("should render a named slot", function() {
      h1_2 = h1.nextSibling;
      expect(h1_2.innerHTML).to.equal("<span>Named Slot Content</span>");
    });
  });
});
