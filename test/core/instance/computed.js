describe("Computed", function() {
  var computed = createTestElement("computed", "<p>{{msg}}</p><p>{{reversed}}</p><p>{{truncated}}</p>");
  var called = false;

  var app = new Moon({
    root: "#computed",
    data: {
      msg: "Message",
      foo: false
    },
    computed: {
      reversed: {
        get: function() {
          called = true;
          return this.get("msg").split("").reverse().join("");
        }
      },
      truncated: {
        get: function() {
          called = true;
          return this.get("msg").substring(0, 3) + "...";
        }
      }
    }
  });

  it("should compute at initial render", function() {
    return wait(function() {
      expect(computed.childNodes[1].textContent).to.equal("egasseM");
      expect(computed.childNodes[2].textContent).to.equal("Mes...");
    });
  });

  it("should update when the message updates", function() {
    app.set("msg", "New");
    return wait(function() {
      expect(computed.childNodes[1].textContent).to.equal("weN");
      expect(computed.childNodes[2].textContent).to.equal("New...");
    });
  });

  it("should cache the value if a non-dependency is changed", function() {
    called = false;
    app.set("foo", true);

    return wait(function() {
      expect(called).to.be["false"];
      expect(computed.childNodes[1].textContent).to.equal("weN");
      expect(computed.childNodes[2].textContent).to.equal("New...");
    });
  });
});
