describe('HTML Directive', function() {
  var html = createTestElement("html", '<span m-html="html"></span>');
  var span = html.firstChild;

  var app = new Moon({
    el: "#html",
    data: {
      html: "<strong>Hello Moon!</strong>"
    }
  });

  it('should fill DOM with a value', function() {
    return wait(function() {
      expect(span.innerHTML).to.equal("<strong>Hello Moon!</strong>");
    });
  });

  it('should not be present at runtime', function() {
    expect(span.getAttribute("m-html")).to.be['null'];
  });
});
