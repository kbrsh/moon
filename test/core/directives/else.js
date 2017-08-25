describe('Else Directive', function() {
  var elseEl = createTestElement("else", '<p m-if="condition">Condition True</p><p m-else>Condition False</p>');

  var app = new Moon({
    el: "#else",
    data: {
      condition: true
    }
  });

  it('should exist when true', function() {
    return wait(function() {
      expect(elseEl.firstChild.textContent).to.equal('Condition True');
    });
  });

  it('should show a different element when false', function() {
    app.set('condition', false);
    return wait(function() {
      expect(elseEl.firstChild.textContent).to.equal('Condition False');
    });
  });

  it('should not be present at runtime', function() {
    expect(elseEl.firstChild.getAttribute("m-else")).to.be['null'];
    app.set('condition', true);
    return wait(function() {
      expect(elseEl.firstChild.getAttribute("m-if")).to.be['null'];
    });
  });
});
