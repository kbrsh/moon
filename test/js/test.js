var expect = chai.expect;
describe('Initializing', function() {
  it('with new', function() {
    expect(new Moon({el: "#initialize"}) instanceof Moon).to.equal(true);
  });
});

describe('Data', function() {
  it('while initializing', function() {
    var dataApp = new Moon({
      el: "#data",
      data: {
        msg: "Hello Moon!"
      }
    });
    expect(document.getElementById("data").innerHTML).to.equal("Hello Moon!");
  });
});
