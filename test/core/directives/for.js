describe('For Directive', function() {
  describe("Array", function() {
    var forEl = createTestElement("for", "<ul><li m-for='item in items'>{{item}}</li></ul>");
    var ul = forEl.firstChild;

    var app = new Moon({
      el: "#for",
      data: {
        items: [1, 2, 3, 4, 5]
      }
    });

    it('should render a list', function() {
      return wait(function() {
        expect(ul.childNodes.length).to.equal(5);
      });
    });

    it('should update a list', function() {
      var items = app.get("items");
      items.push(6);
      app.set("items", items);

      return wait(function() {
        expect(ul.childNodes.length).to.equal(6);
      });
    });

    it('should not be present at runtime', function() {
      expect(ul.childNodes[0].getAttribute("m-for")).to.be['null'];
      expect(ul.childNodes[1].getAttribute("m-for")).to.be['null'];
      expect(ul.childNodes[2].getAttribute("m-for")).to.be['null'];
      expect(ul.childNodes[3].getAttribute("m-for")).to.be['null'];
      expect(ul.childNodes[4].getAttribute("m-for")).to.be['null'];
      expect(ul.childNodes[5].getAttribute("m-for")).to.be['null'];
    });
  });

  describe("Object", function() {
    var forObjectEl = createTestElement("forObject", "<ul><li m-for='item in items'>{{item}}</li></ul>");
    var ul = forObjectEl.firstChild;

    var app = new Moon({
      el: "#forObject",
      data: {
        items: {foo: 1, bar: "str", baz: true}
      }
    });

    it('should render a list', function() {
      return wait(function() {
        expect(ul.childNodes.length).to.equal(3);
      });
    });

    it('should update a list', function() {
      var items = app.get("items");
      items["qux"] = "another string";
      app.set("items", items);

      return wait(function() {
        expect(ul.childNodes.length).to.equal(4);
      });
    });

    it('should not be present at runtime', function() {
      expect(ul.childNodes[0].getAttribute("m-for")).to.be['null'];
      expect(ul.childNodes[1].getAttribute("m-for")).to.be['null'];
      expect(ul.childNodes[2].getAttribute("m-for")).to.be['null'];
      expect(ul.childNodes[3].getAttribute("m-for")).to.be['null'];
    });
  });

  describe("Range", function() {
    var forRangeEl = createTestElement("forRange", "<ul><li m-for='item in range'>{{item}}</li></ul>");
    var ul = forRangeEl.firstChild;

    var app = new Moon({
      el: "#forRange",
      data: {
        range: 3
      }
    });

    it('should render a list', function() {
      return wait(function() {
        expect(ul.childNodes.length).to.equal(3);
      });
    });

    it('should update a list', function() {
      app.set("range", 4);

      return wait(function() {
        expect(ul.childNodes.length).to.equal(4);
      });
    });

    it('should not be present at runtime', function() {
      expect(ul.childNodes[0].getAttribute("m-for")).to.be['null'];
      expect(ul.childNodes[1].getAttribute("m-for")).to.be['null'];
      expect(ul.childNodes[2].getAttribute("m-for")).to.be['null'];
      expect(ul.childNodes[3].getAttribute("m-for")).to.be['null'];
    });
  });
});
