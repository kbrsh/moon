describe('Custom Render', function() {
    var render = createTestElement("render", '');

    var app = new Moon({
      el: "#render",
      render: function(m) {
        return m('div', {attrs: {id: "render"}}, {shouldRender: true}, [m("#text", {shouldRender: true}, this.get('msg'))])
      },
      data: {
        msg: "Hello Moon!"
      }
    });

    it('should use provided render function', function() {
      return wait(function() {
        expect(render.innerHTML).to.equal("Hello Moon!");
      });
    });

    it('should update', function() {
      app.set("msg", "Changed");
      return wait(function() {
        expect(render.innerHTML).to.equal("Changed");
      });
    });
});
