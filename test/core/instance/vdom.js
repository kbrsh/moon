describe("Virtual DOM", function() {
  it("should clone hoisted vnodes", function() {
    var vdomHoistEl = createTestElement("vdomHoist", "");
    var hoisted = Moon.util.m("p", {}, {}, [Moon.util.m("#text", {}, "Paragraph")]);
    var vdomHoistApp = new Moon({
      root: "#vdomHoist",
      data: {
        condition: true
      },
      render: function(m) {
        var children;

        if(this.get("condition") === true) {
          children = [m("h1", {}, {}, [m("#text", {}, "Head")]), hoisted]
        } else {
          children = [hoisted, m("h1", {}, {}, [m("#text", {}, "Head")])];
        }

        return m("div", {}, {}, children);
      },
      methods: {
        update: function() {
          this.set("condition", false);
        }
      }
    });

    expect(vdomHoistEl.firstChild.nodeName.toLowerCase()).to.equal("h1");
    expect(vdomHoistEl.firstChild.textContent).to.equal("Head");

    expect(vdomHoistEl.firstChild.nextSibling.nodeName.toLowerCase()).to.equal("p");
    expect(vdomHoistEl.firstChild.nextSibling.textContent).to.equal("Paragraph");

    vdomHoistApp.methods.update();

    // return wait(function() {
    //   expect(vdomHoistEl.firstChild.nodeName.toLowerCase()).to.equal("p");
    //   expect(vdomHoistEl.firstChild.textContent).to.equal("paragraph");
    //
    //   expect(vdomHoistEl.firstChild.nextSibling.nodeName.toLowerCase()).to.equal("h1");
    //   expect(vdomHoistEl.firstChild.nextSibling.textContent).to.equal("Head");
    // });
  });
});
