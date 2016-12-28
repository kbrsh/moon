var expect = chai.expect;
describe('Initializing', function() {
  it('with new', function() {
    expect(new Moon({el: "#initialize"}) instanceof Moon).to.equal(true);
  });
});

describe('Data', function() {
  var dataApp = new Moon({
    el: "#data",
    data: {
      msg: "Hello Moon!"
    }
  });
  it('when initializing', function() {
    expect(document.getElementById("data").innerHTML).to.equal("Hello Moon!");
  });
  it('when setting', function() {
    dataApp.set('msg', 'New Value');
    expect(document.getElementById("data").innerHTML).to.equal("New Value");
  });
  it('when getting', function() {
    expect(dataApp.get('msg')).to.equal("New Value");
  });
});

describe('Methods', function() {
  var methodApp = new Moon({
    el: "#method",
    data: {
      count: 0
    },
    methods: {
      increment: function() {
        methodApp.set('count', methodApp.get('count') + 1);
      }
    }
  });
  it('when calling a method', function() {
    methodApp.method('increment');
    expect(methodApp.get('count')).to.equal(1);
  });
  it('should update DOM', function() {
    methodApp.method('increment');
    expect(document.getElementById("method").innerHTML).to.equal('2');
  });
});
