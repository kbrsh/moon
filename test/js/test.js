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
  it('should not be present at runtime', function() {
    expect(document.getElementById('if-condition').getAttribute("m-if")).to.be.null;
  });
});

describe('Show Directive', function() {
  var showApp = new Moon({
    el: "#show",
    data: {
      condition: true
    }
  });
  it('should display when true', function() {
    expect(document.getElementById('show-condition').style.display).to.equal('block');
  });
  it('should not display when false', function() {
    showApp.set('condition', false);
    expect(document.getElementById('show-condition').style.display).to.equal('none');
  });
  it('should not be present at runtime', function() {
    expect(document.getElementById('show-condition').getAttribute("m-show")).to.be.null;
  });
});

describe('Model Directive', function() {
  var modelApp = new Moon({
    el: "#model",
    data: {
      msg: "Hello Moon!"
    }
  });
  it('should update value when initialized', function() {
    expect(document.getElementById('model-msg').innerHTML).to.equal('Hello Moon!');
  });
  it('should not be present at runtime', function() {
    expect(document.getElementById('model-msg-input').getAttribute("m-model")).to.be.null;
  });
});

describe('On Directive', function() {
  var onApp = new Moon({
    el: "#on",
    data: {
      count: 0
    },
    methods: {
      increment: function() {
        onApp.set('count', onApp.get('count') + 1);
      }
    }
  });
  it('should call a method', function() {
    document.getElementById("on-increment-button").click();
    expect(onApp.get('count')).to.equal(1);
  });
  it('should update DOM', function() {
    document.getElementById("on-increment-button").click();
    expect(document.getElementById("on-count").innerHTML).to.equal('2');
  });
  it('should not be present at runtime', function() {
    expect(document.getElementById('on-increment-button').getAttribute("m-on")).to.be.null;
  });
});

describe('Text Directive', function() {
  var textApp = new Moon({
    el: "#text",
    data: {
      msg: "Hello Moon!"
    }
  });
  it('should fill DOM with a value', function() {
    expect(document.getElementById("text-directive-span").innerHTML).to.equal("Hello Moon!");
  });
  it('should not be present at runtime', function() {
    expect(document.getElementById('text-directive-span').getAttribute("m-text")).to.be.null;
  });
});
