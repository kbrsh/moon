describe('HTML with DOM', function() {
  var html = createTestElement("html", '<span m-dom:innerHTML="html"></span>');
  var span = html.firstChild;

  var app = new Moon({
    root: "#html",
    template: "<div id='html'><span m-dom:innerHTML='html'></span></div>",
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
    expect(span.getAttribute("m-dom:innerHTML")).to.be['null'];
  });
});
