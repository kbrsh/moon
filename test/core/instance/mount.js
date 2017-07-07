describe('Mount', function() {
  it('when mounted on a selector', function() {
    var mountSelector = createTestElement("mountSelector", '{{msg}}');

    new Moon({
      el: "#mountSelector",
      data: {
        msg: "Hello Moon!"
      }
    });

    return wait(function() {
      expect(mountSelector.innerHTML).to.equal("Hello Moon!");
    });
  });

  it('when mounted on an element', function() {
    var mountElement = createTestElement("mountElement", '{{msg}}');

    new Moon({
      el: mountElement,
      data: {
        msg: "Hello Moon!"
      }
    });

    return wait(function() {
      expect(mountElement.innerHTML).to.equal("Hello Moon!");
    });
  });
});
