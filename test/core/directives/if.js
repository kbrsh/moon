describe('If Directive', function() {
  var ifEl = createTestElement("if", '<p m-if="condition">Condition True</p>');

  var app = new Moon({
    el: "#if",
    data: {
      condition: true
    }
  });

  it('should exist when true', function() {
    return wait(function() {
      expect(ifEl.firstChild.innerHTML).to.equal('Condition True');
    });
  });

  it('should not exist when false', function() {
    app.set('condition', false);
    return wait(function() {
      expect(ifEl.firstChild.textContent).to.equal("");
    });
  });

  it('should not be present at runtime', function() {
    app.set('condition', true);
    return wait(function() {
      expect(ifEl.firstChild.getAttribute("m-if")).to.be['null'];
    });
  });
});
