describe("On Directive", function() {
  var on = createTestElement("on", '<p>{{count}}</p><button m-on:click="increment">Increment</button><button m-on:click="changeCustomIgnored(true, event)"></button>');
  var p = on.firstChild;
  var button = p.nextSibling;
  var customIgnoredButton = button.nextSibling
  var customIgnoredParameters = false;

  var evt;

  var app = new Moon({
    root: "#on",
    data: {
      count: 0
    },
    methods: {
      increment: function() {
        this.set("count", this.get("count") + 1);
      },
      changeCustomIgnored: function(condition, e) {
        customIgnoredParameters = condition;
        evt = e;
      }
    }
  });

  it("should call a method", function() {
    button.click();

    return wait(function() {
      expect(app.get("count")).to.equal(1);
    });
  });

  it("should update DOM", function() {
    button.click();
    return wait(function() {
      expect(p.innerHTML).to.equal("2");
    });
  });

  it("should call with ignored custom parameters", function() {
    customIgnoredButton.click();
    return wait(function() {
      expect(customIgnoredParameters).to.be["true"];
    });
  });

  it("should pass an event object", function() {
    expect(evt.target.tagName).to.equal("BUTTON");
  });

  it("should not be present at runtime", function() {
    expect(button.getAttribute("m-on")).to.be["null"];
  });
});
