describe('Template', function() {
  var template = createTestElement("template", '');

  var app = new Moon({
    el: "#template",
    template: "<div id='template'>{{msg}}</div>",
    data: {
      msg: "Hello Moon!"
    }
  });

  it('should use provided template', function() {
    return wait(function() {
      expect(template.innerHTML).to.equal("Hello Moon!");
    });
  });

  it('should update', function() {
    app.set("msg", "Changed");
    return wait(function() {
      expect(template.innerHTML).to.equal("Changed");
    });
  });
});
