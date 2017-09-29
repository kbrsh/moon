describe('Custom Directive', function() {
  var customDirective = createTestElement("customDirective", '<span m-square="2"></span>');

  Moon.directive("square", function(el, val, vdom) {
    vdom.props.dom = {innerHTML: String(val*val)};
  });

  new Moon({
    root: "#customDirective"
  });

  it("should execute", function() {
    return wait(function() {
      expect(customDirective.firstChild.innerHTML).to.equal("4");
    });
  });

  it("should error on unknown directives", function() {
    var fail = false;
    captureError(function() {
      fail = true;
    });

    var customDirectiveError = createTestElement("customDirectiveError", "<div m-unknown></div>");
    new Moon({
      root: "#customDirectiveError"
    });

    expect(fail).to.be["true"];
  });

  it("should not be present at runtime", function() {
    expect(customDirective.firstChild.getAttribute("m-square")).to.be['null'];
  });
});
