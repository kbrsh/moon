var expect = chai.expect;
Moon.config.silent = true;

// var MoonPerformance = {
//   init: function() {
//     var MoonBuild = Moon.prototype.build;
//     var MoonInit = Moon.prototype.init;
//
//     var formatNum = function(num) {
//       if(num >= 0.5) {
//       	return num.toFixed(2) + 'ms'
//       } else {
//       	return num.toFixed(2)*1000 + "µs";
//       }
//     }
//
//     Moon.prototype.init = function() {
//       var id = this.$opts.el + "@init";
//       performance.mark("start " + id);
//       MoonInit.apply(this, arguments);
//       performance.mark("end " + id);
//       performance.measure(id, "start " + id, "end " + id);
//       var entries = performance.getEntriesByName(id);
//       console.log("[Moon Performance] " + id + " - " + formatNum(entries[entries.length - 1].duration));
//     }
//
//     Moon.prototype.build = function() {
//       var id = this.$opts.el + "@build";
//       performance.mark("start " + id);
//       MoonBuild.apply(this, arguments);
//       performance.mark("end " + id);
//       performance.measure(id, "start " + id, "end " + id);
//       var entries = performance.getEntriesByName(id);
//       console.log("[Moon Performance] " + id + " - " + formatNum(entries[entries.length - 1].duration));
//     }
//   }
// }
//
// Moon.use(MoonPerformance);


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
    Moon.nextTick(function() {
      expect(document.getElementById("destroy").innerHTML).to.not.equal("New Value!");
    });
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
    Moon.nextTick(function() {
      expect(document.getElementById("data").innerHTML).to.equal("New Value");
    });
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
    methodApp.callMethod('increment');
    expect(methodApp.get('count')).to.equal(1);
  });
  it('should update DOM', function() {
    methodApp.callMethod('increment');
    Moon.nextTick(function() {
      expect(document.getElementById("method").innerHTML).to.equal('2');
    });
  });
});

describe('Custom Directive', function() {
  Moon.directive("square", function(el, val, vdom) {
    var num = parseInt(val);
    el.textContent = val*val;
    for(var i = 0; i < vdom.children.length; i++) {
      vdom.children[i].val = val*val;
    }
  });
  var customDirectiveApp = new Moon({
    el: "#customDirective"
  });
  it('should execute', function() {
    Moon.nextTick(function() {
      expect(document.getElementById("custom-directive-span").innerHTML).to.equal("4");
    });
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
    Moon.nextTick(function() {
      expect(document.getElementById('if-condition')).to.be.null;
    });
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
    Moon.nextTick(function() {
      expect(document.getElementById('show-condition').style.display).to.equal('none');
    });
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
  var evt;
  var onApp = new Moon({
    el: "#on",
    data: {
      count: 0
    },
    methods: {
      increment: function(e) {
        onApp.set('count', onApp.get('count') + 1);
        evt = e;
      }
    }
  });
  it('should call a method', function() {
    document.getElementById("on-increment-button").click();
    expect(onApp.get('count')).to.equal(1);
  });
  it('should update DOM', function() {
    document.getElementById("on-increment-button").click();
    Moon.nextTick(function() {
      expect(document.getElementById("on-count").innerHTML).to.equal('2');
    });
  });
  it('should pass an event object', function() {
    expect(evt.target.tagName).to.equal('BUTTON');
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

describe('HTML Directive', function() {
  var htmlApp = new Moon({
    el: "#html",
    data: {
      msg: "<strong>Hello Moon!</strong>"
    }
  });
  it('should fill DOM with a value', function() {
    expect(document.getElementById("html-directive-span").innerHTML).to.equal("<strong>Hello Moon!</strong>");
  });
  it('should not be present at runtime', function() {
    expect(document.getElementById('html-directive-span').getAttribute("m-html")).to.be.null;
  });
});

describe('Once Directive', function() {
  var onceApp = new Moon({
    el: "#once",
    data: {
      msg: "Hello Moon!"
    }
  });
  it('should fill DOM with a value', function() {
    expect(document.getElementById("once-directive-span").innerHTML).to.equal("Hello Moon!");
  });
  it('should not update element once value is updated', function() {
    onceApp.set('msg', "Changed");
    Moon.nextTick(function() {
      expect(document.getElementById("once-directive-span").innerHTML).to.equal("Hello Moon!");
    });
  });
  it('should not be present at runtime', function() {
    expect(document.getElementById('once-directive-span').getAttribute("m-once")).to.be.null;
  });
});

describe('Pre Directive', function() {
  var preApp = new Moon({
    el: "#pre",
    data: {
      msg: "Hello Moon!"
    }
  });
  it('should not fill DOM with a value', function() {
    expect(document.getElementById("pre-directive-span").innerHTML).to.equal("{{msg}}");
  });
  it('should not update element once value is updated', function() {
    preApp.set('msg', "Changed");
    Moon.nextTick(function() {
      expect(document.getElementById("pre-directive-span").innerHTML).to.equal("{{msg}}");
    });
  });
  it('should not be present at runtime', function() {
    expect(document.getElementById('pre-directive-span').getAttribute("m-pre")).to.be.null;
  });
});

describe('Mask Directive', function() {
  var maskApp = new Moon({
    el: "#mask"
  });
  it('should not be present at runtime', function() {
    expect(document.getElementById('mask-directive-span').getAttribute("m-mask")).to.be.null;
  });
});

describe('Plugin', function() {
  var emptyPlugin = {
    init: function(Moon) {
      Moon.directive('empty', function(el, val, vdom) {
        el.innerHTML = "";
        for(var i = 0; i < vdom.children.length; i++) {
          vdom.children[i].meta.shouldRender = false;
        }
      });
    }
  }
  Moon.use(emptyPlugin);
  var pluginApp = new Moon({
    el: "#plugin",
    data: {
      msg: "Hello Moon!"
    }
  });
  it('should execute', function() {
    expect(document.getElementById("plugin-span").innerHTML).to.equal("");
  });
});

describe('Template', function() {
    var templateApp = new Moon({
      el: "#template",
      template: "<div id='template'>{{msg}}</div>",
      data: {
        msg: "Hello Moon!"
      }
    });
    it('should use provided template', function() {
      expect(document.getElementById("template").innerHTML).to.equal("Hello Moon!");
    });
    it('should update', function() {
      templateApp.set("msg", "Changed");
      Moon.nextTick(function() {
        expect(document.getElementById("template").innerHTML).to.equal("Changed");
      });
    });
});

describe('Custom Render', function() {
    var renderApp = new Moon({
      el: "#render",
      render: function(h) {
        return h('div', {id: "render"}, null, this.get('msg'))
      },
      data: {
        msg: "Hello Moon!"
      }
    });
    it('should use provided render function', function() {
      expect(document.getElementById("render").innerHTML).to.equal("Hello Moon!");
    });
    it('should update', function() {
      renderApp.set("msg", "Changed");
      Moon.nextTick(function() {
        expect(document.getElementById("render").innerHTML).to.equal("Changed");
      });
    });
});


// describe('Component', function() {
//     Moon.component('my-component', {
//       props: ['componentprop', 'otherprop'],
//       template: "<div>{{componentprop}}</div>"
//     })
//     var componentApp = new Moon({
//       el: "#component",
//       data: {
//         parentMsg: "Hello Moon!"
//       }
//     });
//     it('should render HTML', function() {
//       expect(document.getElementById("component")).to.not.be.null;
//     });
//     it('should render with props', function() {
//       expect(document.getElementById("component").innerHTML).to.equal("<div>Hello Moon!</div>");
//     });
//     it('should render when updated', function() {
//       componentApp.set('parentMsg', 'Changed');
//       Moon.nextTick(function() {
//         expect(document.getElementById("component").innerHTML).to.equal("<div>Changed</div>");
//       });
//     });
// });
