describe('Destroy', function() {
  var destroyEl = createTestElement("destroy", '{{msg}}');

  var app = new Moon({
    el: "#destroy",
    data: {
      msg: "Hello Moon!"
    }
  });

  it('when destroyed', function() {
    app.destroy();
    app.set('msg', 'New Value!');
    return wait(function() {
      expect(destroyEl.innerHTML).to.not.equal("New Value!");
    });
  });
});
