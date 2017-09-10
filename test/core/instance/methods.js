describe("Methods", function() {
  var method = createTestElement("method", "{{count}}");

  var app = new Moon({
    root: "#method",
    data: {
      count: 0
    },
    methods: {
      increment: function() {
        this.set("count", this.get("count") + 1);
      }
    }
  });

  it("when calling a method", function() {
    app.methods.increment();
    return wait(function() {
      expect(app.get("count")).to.equal(1);
    });
  });

  it("should update DOM", function() {
    app.methods.increment();
    return wait(function() {
      expect(method.innerHTML).to.equal("2");
    });
  });
});
