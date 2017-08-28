describe('Show Directive', function() {
  var show = createTestElement("show", '<p m-show="condition">Condition True</p>');

  var app = new Moon({
    root: "#show",
    data: {
      condition: true
    }
  });

  it('should display when true', function() {
    return wait(function() {
      expect(show.firstChild.style.display).to.equal('');
    });
  });

  it('should not display when false', function() {
    app.set('condition', false);
    return wait(function() {
      expect(show.firstChild.style.display).to.equal('none');
    });
  });

  it('should not be present at runtime', function() {
    expect(show.firstChild.getAttribute("m-show")).to.be['null'];
  });
});
