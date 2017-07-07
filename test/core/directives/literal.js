describe('Literal Directive', function() {
  describe("Expression", function() {
    var literal = createTestElement("literal", '<span m-literal:class="(num+1).toString()"></span>');
    var span = literal.firstChild;

    var app = new Moon({
      el: "#literal",
      data: {
        num: 1
      }
    });

    it('should treat the value as a literal expression', function() {
      return wait(function() {
        expect(span.getAttribute("class")).to.equal("2");
      });
    });

    it('should not be present at runtime', function() {
      expect(span.getAttribute("m-literal:class")).to.be['null'];
    });
  });

  describe("Class", function() {
    describe("Array of Classes", function() {
      var literalClass = createTestElement("literalClass", '<span m-literal:class="[\'1\', \'2\', \'3\']"></span>');
      var span = literalClass.firstChild;

      var app = new Moon({
        el: "#literalClass"
      });

      it('should be able to handle an array of classes', function() {
        return wait(function() {
          expect(span.getAttribute("class")).to.equal("1 2 3");
        });
      });

      it('should not be present at runtime', function() {
        expect(span.getAttribute("m-literal:class")).to.be["null"];
      });
    });

    describe("Object of Classes", function() {
      var literalConditionalClass = createTestElement("literalConditionalClass", '<span m-literal:class="{trueVal: trueVal, falseVal: falseVal}"></span>');
      var span = literalConditionalClass.firstChild;

      var app = new Moon({
        el: "#literalConditionalClass",
        data: {
          trueVal: true,
          falseVal: false
        }
      });

      it('should be able to handle an object of conditional classes', function() {
        return wait(function() {
          expect(span.getAttribute("class")).to.equal("trueVal");
        });
      });

      it("should not be present at runtime", function() {
        expect(span.getAttribute("m-literal:class")).to.be["null"];
      });
    });
  });

  describe("Boolean", function() {
    var literalBooleanValue = createTestElement("literalBooleanValue", '<span m-literal:disabled="condition"></span>');
    var span = literalBooleanValue.firstChild;

    var app = new Moon({
      el: "#literalBooleanValue",
      data: {
        condition: true
      }
    });

    it('should be able to handle a true boolean value', function() {
      return wait(function() {
        expect(span.getAttribute("disabled")).to.equal("");
      });
    });

    it('should be able to handle a false boolean value', function() {
      app.set('condition', false);

      return wait(function() {
        expect(span.getAttribute("disabled")).to.equal(null);
      })
    });

    it("should not be present at runtime", function() {
      app.set('condition', true);

      return wait(function() {
        expect(span.getAttribute("m-literal:disabled")).to.be["null"];
      });
    });
  });
});
