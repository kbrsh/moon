describe("Data", function() {
  var data = createTestElement("data", "{{msg}}");
  var data2 = createTestElement("data2", "{{msg.obj.nested}}");
  var data3 = createTestElement("data3", "{{msg.obj.nested}}");
  var dataUndefined = createTestElement("dataUndefined", "{{msg}}");

  var dataApp = new Moon({
    root: "#data",
    data: {
      msg: "Hello Moon!"
    }
  });

  var dataApp2 = new Moon({
    root: "#data2",
    data: {
      msg: {
        obj: {
          nested: "Nested Object"
        }
      }
    }
  });

  var dataApp3 = new Moon({
    root: "#data3",
    data: {
      msg: {
        obj: {

        }
      }
    }
  });

  var fail = false;
  console.error = function() {
    fail = true;
    console.error = noop;
  }
  var dataAppUndefined = new Moon({
    root: "#dataUndefined"
  });

  it("when initializing", function() {
    return wait(function() {
      expect(data.innerHTML).to.equal("Hello Moon!");
    });
  });

  it("when initializing with an undefined reference", function() {
    expect(fail).to.be["true"];
  });

  it("when setting", function() {
    dataApp.set("msg", "New Value");
    return wait(function() {
      expect(data.innerHTML).to.equal("New Value");
    });
  });

  it("when setting new property", function() {
    dataApp3.set({
      msg: {
        obj: {
          nested: "Nested Value"
        }
      }
    });
    return wait(function() {
      expect(data3.innerHTML).to.equal("Nested Value");
    });
  });

  it("when updating new data property", function() {
    dataApp3.set({
      msg: {
        obj: {
          nested: "New Nested"
        }
      }
    });
    return wait(function() {
      expect(data3.innerHTML).to.equal("New Nested");
    });
  });

  it("when getting", function() {
    expect(dataApp.get("msg")).to.equal("New Value");
  });
});
