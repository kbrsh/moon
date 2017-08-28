describe("Init Hook", function() {
  it("should run", function() {
    var run = false;
    var app = new Moon({
      hooks: {
        init: function() {
          run = true;
        }
      }
    });

    expect(run).to.equal(true);
  });
});

describe("Mounted Hook", function() {
  it("should run", function() {
    createTestElement("mountedHook", "");

    var run = false;
    var app = new Moon({
      root: "#mountedHook",
      hooks: {
        mounted: function() {
          run = true;
          expect(run).to.equal(true);
        }
      }
    });
  });
});

describe("Updated Hook", function() {
  it("should run", function() {
    createTestElement("updatedHook", "");

    var run = false;
    var app = new Moon({
      root: "#updatedHook",
      hooks: {
        updated: function() {
          run = true;
          expect(run).to.equal(true);
        }
      }
    });

    app.build();
  });
});

describe("Destroyed Hook", function() {
  it("should run", function() {
    createTestElement("destroyedHook", "");

    var run = false;
    var app = new Moon({
      root: "#destroyedHook",
      hooks: {
        destroyed: function() {
          run = true;
        }
      }
    });

    app.destroy();
    expect(run).to.equal(true);
  });
});
