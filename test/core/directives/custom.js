describe('Custom Directive', function() {
  var customDirective = createTestElement("customDirective", '<span m-square="2"></span>');

  Moon.directive("square", function(el, val, vdom) {
    vdom.props.dom = {innerHTML: String(val*val)};
  });

  new Moon({
    el: "#customDirective"
  });

  it('should execute', function() {
    return wait(function() {
      expect(customDirective.firstChild.innerHTML).to.equal("4");
    });
  });

  it('should not be present at runtime', function() {
    expect(customDirective.firstChild.getAttribute("m-square")).to.be['null'];
  });
});
