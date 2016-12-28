var expect = chai.expect;
describe('Initializing', function() {
  it('with new', function() {
    expect(new Moon({el: "#initialize"}) instanceof Moon).to.equal(true);
  });
});

describe('Instance', function() {
  var destroyApp = new Moon({
    el: "#destroy",
    data: {
      msg: "Hello Moon!"
    }
  });
  it('when destroyed', function() {
    destroyApp.destroy();
    destroyApp.set('msg', 'New Value!');
    expect(document.getElementById("destroy").innerHTML).to.not.equal("New Value!")
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


describe('If Directive', function() {
  var ifApp = new Moon({
    el: "#if",
    data: {
      condition: true
    }
  });
  it('should exist when true', function() {
    expect(document.getElementById('if-condition').innerHTML).to.equal('Condition True');
  });
  it('should not exist when false', function() {
    ifApp.set('condition', false);
    expect(document.getElementById('if-condition').innerHTML).to.not.equal('Condition True');
  });
});
