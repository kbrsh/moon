describe('Mask Directive', function() {
  var mask = createTestElement("mask", '<span m-mask>{{msg}}</span>');
  var span = mask.firstChild;

  new Moon({
    el: "#mask",
    data: {
      msg: "Hello Moon!"
    }
  });

  it('should not be present at runtime', function() {
    return wait(function() {
      expect(span.getAttribute("m-mask")).to.be['null'];
    });
  });
});
