describe('Model Directive', function() {
  describe("Static Text Input", function() {
    var model = createTestElement("model", '<p>{{msg}}</p><input type="text" m-model="msg"/>');
    var p = model.firstChild;
    var input = p.nextSibling;

    var app = new Moon({
      el: "#model",
      data: {
        msg: "Hello Moon!"
      }
    });

    it('should have value when initialized', function() {
      return wait(function() {
        expect(p.innerHTML).to.equal('Hello Moon!');
        expect(input.value).to.equal('Hello Moon!');
      });
    });

    it('should update value from data', function() {
      app.set("msg", "ChangedData");

      return wait(function() {
        expect(input.value).to.equal('ChangedData');
        expect(p.innerHTML).to.equal('ChangedData');
      });
    });

    it('should update value from input', function() {
      var inputEvent = new CustomEvent('input');
      input.value = "Changed";
      input.dispatchEvent(inputEvent);

      return wait(function() {
        expect(p.innerHTML).to.equal('Changed');
      });
    });

    it('should not be present at runtime', function() {
      expect(input.getAttribute("m-model")).to.be['null'];
    });
  });


  describe("Dynamic Text Input", function() {
    var modelDynamic = createTestElement("modelDynamic", '<p>{{arr[index]}}</p><input type="text" m-model="arr[index]"/>');
    var p = modelDynamic.firstChild;
    var input = p.nextSibling;

    var app = new Moon({
      el: "#modelDynamic",
      data: {
        arr: ["Random", "Hello Moon!"],
        index: 1
      }
    });

    it('should have value when initialized', function() {
      return wait(function() {
        expect(p.innerHTML).to.equal('Hello Moon!');
        expect(input.value).to.equal('Hello Moon!');
      });
    });

    it('should update value from data', function() {
      app.set("arr[1]", "ChangedData");

      return wait(function() {
        expect(input.value).to.equal('ChangedData');
        expect(p.innerHTML).to.equal('ChangedData');
      });
    });

    it('should update value from input', function() {
      var inputEvent = new CustomEvent('input');
      input.value = "Changed";
      input.dispatchEvent(inputEvent);

      return wait(function() {
        expect(p.innerHTML).to.equal('Changed');
      });
    });

    it('should not be present at runtime', function() {
      expect(input.getAttribute("m-model")).to.be['null'];
    });
  });

  describe("Checkbox", function() {
    var modelCheckbox = createTestElement("modelCheckbox", '<p>{{checked}}</p><input type="checkbox" m-model="checked"/>');
    var p = modelCheckbox.firstChild;
    var input = p.nextSibling;

    var app = new Moon({
      el: "#modelCheckbox",
      data: {
        checked: true
      }
    });

    it('should have value when initialized', function() {
      return wait(function() {
        expect(p.innerHTML).to.equal('true');
        expect(input.checked).to.equal(true);
      });
    });

    it('should update value from data', function() {
      app.set("checked", false);

      return wait(function() {
        expect(p.innerHTML).to.equal('false');
        expect(input.checked).to.equal(false);
      });
    });

    it('should update value from input', function() {
      var changeEvent = new CustomEvent('change');
      input.checked = true;
      input.dispatchEvent(changeEvent);

      return wait(function() {
        expect(p.innerHTML).to.equal('true');
      });
    });

    it('should not be present at runtime', function() {
      expect(input.getAttribute("m-model")).to.be['null'];
    });
  });

  describe("Radio", function() {
    var modelRadio = createTestElement("modelRadio", '<p>{{current}}</p><input type="radio" name="item" m-model="current" value="Foo"/><input type="radio" name="item" m-model="current" value="Bar"/><input type="radio" name="item" m-model="current" value="Baz"/>');
    var p = modelRadio.firstChild;
    var input1 = p.nextSibling;
    var input2 = input1.nextSibling;
    var input3 = input2.nextSibling;

    var app = new Moon({
      el: "#modelRadio",
      data: {
        current: "Bar"
      }
    });

    it('should have value when initialized', function() {
      return wait(function() {
        expect(p.innerHTML).to.equal('Bar');
        expect(input2.checked).to.equal(true);
      });
    });

    it('should update value from data', function() {
      app.set("current", "Foo");

      return wait(function() {
        expect(p.innerHTML).to.equal('Foo');
        expect(input1.checked).to.equal(true);
      });
    });

    it('should update value from input', function() {
      var changeEvent = new CustomEvent('change');
      input1.checked = false;
      input2.checked = false;
      input3.checked = true;
      input3.dispatchEvent(changeEvent);

      return wait(function() {
        expect(p.innerHTML).to.equal('Baz');
      });
    });

    it('should not be present at runtime', function() {
      expect(input1.getAttribute("m-model")).to.be['null'];
      expect(input2.getAttribute("m-model")).to.be['null'];
      expect(input3.getAttribute("m-model")).to.be['null'];
    });
  });
});
