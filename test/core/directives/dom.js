describe("DOM Directive", function() {
  var domDirective = createTestElement("domDirective", '<span m-dom:domproperty="[1, 2, 3]"></span>');
  var span = domDirective.firstChild;

  var app = new Moon({
    root: "#domDirective"
  });

  it("should treat the value as a literal expression", function() {
    return wait(function() {
      expect(span.getAttribute("domproperty")).to.be["null"];
      expect(span.domproperty).to.deep.equal([1, 2, 3]);
    });
  });

  it("should not be present at runtime", function() {
    expect(span.getAttribute("m-dom:domproperty")).to.be['null'];
  });
});
