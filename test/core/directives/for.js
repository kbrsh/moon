describe('For Directive', function() {
  var forEl = createTestElement("for", "<ul><li m-for='item in items'>{{item}}</li></ul>");
  var ul = forEl.firstChild;

  var app = new Moon({
    el: "#for",
    data: {
      items: [1, 2, 3, 4, 5]
    }
  });

  it('should render a list', function() {
    expect(ul.childNodes.length).to.equal(5);
  });

  it('should update a list', function() {
    var items = app.get("items");
    items.push(6);
    app.set("items", items);

    return wait(function() {
      expect(ul.childNodes.length).to.equal(6);
    });
  });

  it('should not be present at runtime', function() {
    expect(ul.childNodes[0].getAttribute("m-for")).to.be['null'];
    expect(ul.childNodes[1].getAttribute("m-for")).to.be['null'];
    expect(ul.childNodes[2].getAttribute("m-for")).to.be['null'];
    expect(ul.childNodes[3].getAttribute("m-for")).to.be['null'];
    expect(ul.childNodes[4].getAttribute("m-for")).to.be['null'];
    expect(ul.childNodes[5].getAttribute("m-for")).to.be['null'];
  });
});
