var expect = chai.expect;
Moon.config.silent = true;
console.log("[Moon] Running Tests...");
console.log("[Moon] Version: " + Moon.version);
var createTestElement = function(id, html) {
  var el = document.createElement("div");
  el.innerHTML = html;
  el.id = id;
  document.getElementById("moon-els").appendChild(el);
  return el;
}
// var MoonPerformance = {
//   init: function() {
//     var MoonBuild = Moon.prototype.build;
//     var MoonInit = Moon.prototype.init;
//     var MoonRender = Moon.prototype.render;
//     var MoonMount = Moon.prototype.mount;
//     var MoonPatch = Moon.prototype.patch;
//
//     var formatNum = function(num) {
//       if(num >= 0.5) {
//       	return num.toFixed(2) + 'ms'
//       } else {
//       	return num.toFixed(2)*1000 + "µs";
//       }
//     }
//
//     var name = function(instance) {
//       return instance.$parent ? instance.$name : "root";
//     }
//
//     Moon.prototype.init = function() {
//       var id = name(this) + "@init";
//       performance.mark("start " + id);
//       MoonInit.apply(this, arguments);
//       performance.mark("end " + id);
//       performance.measure(id, "start " + id, "end " + id);
//       var entries = performance.getEntriesByName(id);
//     }
//
//     Moon.prototype.build = function() {
//       var id = name(this) + "@build";
//       performance.mark("start " + id);
//       MoonBuild.apply(this, arguments);
//       performance.mark("end " + id);
//       performance.measure(id, "start " + id, "end " + id);
//       var entries = performance.getEntriesByName(id);
//     }
//
//     Moon.prototype.render = function() {
//       var id = name(this) + "@render";
//       performance.mark("start " + id);
//       var r = MoonRender.apply(this, arguments);
//       performance.mark("end " + id);
//       performance.measure(id, "start " + id, "end " + id);
//       var entries = performance.getEntriesByName(id);
//       return r;
//     }
//
//     Moon.prototype.mount = function() {
//       var id = name(this) + "@mount";
//       performance.mark("start " + id);
//       MoonMount.apply(this, arguments);
//       performance.mark("end " + id);
//       performance.measure(id, "start " + id, "end " + id);
//       var entries = performance.getEntriesByName(id);
//     }
//
//     Moon.prototype.patch = function() {
//       var id = name(this) + "@patch";
//       performance.mark("start " + id);
//       MoonPatch.apply(this, arguments);
//       performance.mark("end " + id);
//       performance.measure(id, "start " + id, "end " + id);
//       var entries = performance.getEntriesByName(id);
//     }
//   }
// }
//
// Moon.use(MoonPerformance);


describe('Instance', function() {
  describe('Initializing', function() {
    createTestElement("initialize", "");
    it('with new', function() {
      expect(new Moon({el: "#initialize"}) instanceof Moon).to.equal(true);
    });
  });

  describe('Destroy', function() {
    createTestElement("destroy", '{{msg}}');
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
});


describe('Data', function() {
  createTestElement("data", '{{msg}}');
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
  createTestElement("method", '{{count}}');
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

describe("Directive", function() {
  describe('Custom Directive', function() {
    createTestElement("customDirective", '<span m-square="2" id="custom-directive-span"></span>');
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
    createTestElement("if", '<p m-if="{{condition}}" id="if-condition">Condition True</p>');
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
    createTestElement("show", '<p m-show="{{condition}}" id="show-condition">Condition True</p>');
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
    createTestElement("model", '<p id="model-msg">{{msg}}</p><input type="text" m-model="msg" id="model-msg-input"/>');
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
    createTestElement("on", '<p id="on-count">{{count}}</p><button m-on="click:increment" id="on-increment-button">Increment</button>');
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

  describe('For Directive', function() {
    createTestElement("for", "<ul id='forList'><li m-for='item in items'>{{item}}</li></ul>");
    var forApp = new Moon({
      el: "#for",
      data: {
        items: [1, 2, 3, 4, 5]
      }
    });
    it('should render a list', function() {
      expect(document.getElementById('forList').childNodes.length).to.equal(5);
    });
    it('should update a list', function() {
      var items = forApp.get("items");
      items.push(6);
      forApp.set("items", items);
      Moon.nextTick(function() {
        expect(document.getElementById('forList').childNodes.length).to.equal(6);
      });
    });
    it('should not be present at runtime', function() {
      expect(document.getElementById('forList').childNodes[0].getAttribute("m-for")).to.be.null;
    });
  });

  describe('Text Directive', function() {
    createTestElement("text", '<span m-text="{{msg}}" id="text-directive-span"></span>');
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
    createTestElement("html", '<span m-html="{{msg}}" id="html-directive-span"></span>');
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
    createTestElement("once", '<span m-once id="once-directive-span">{{msg}}</span>');
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
    createTestElement("pre", '<span m-pre id="pre-directive-span">{{msg}}</span>');
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
    createTestElement("mask", '<span m-mask id="mask-directive-span">{{msg}}</span>');
    var maskApp = new Moon({
      el: "#mask"
    });
    it('should not be present at runtime', function() {
      expect(document.getElementById('mask-directive-span').getAttribute("m-mask")).to.be.null;
    });
  });
});

describe('Plugin', function() {
  createTestElement("plugin", '<span m-empty id="plugin-span">{{msg}}</span>');
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
    createTestElement("template", '');
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
    createTestElement("render", '');
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

describe('Functional Component', function() {
    createTestElement("functional", '<functional-component someprop="{{parentMsg}}"></functional-component><slot-functional-component>Default Slot Content<span slot="named">Named Slot Content</span></slot-functional-component>');
    Moon.component('functional-component', {
      functional: true,
      props: ['someprop'],
      render: function(h, ctx) {
        return h("h1", {class: "functionalComponent"}, null, ctx.data.someprop);
      }
    });
    Moon.component('slot-functional-component', {
      functional: true,
      render: function(h, ctx) {
        return h("div", {class: "functionalSlotComponent"}, null, h("h1", {}, null, ctx.slots.default), h("h1", {}, null, ctx.slots.named));
      }
    });
    var functionalApp = new Moon({
      el: "#functional",
      data: {
        parentMsg: "Hello Moon!"
      }
    });
    it('should render HTML', function() {
      expect(document.getElementsByClassName("functionalComponent")).to.not.be.null;
    });
    it('should render with props', function() {
      expect(document.getElementsByClassName("functionalComponent")[0].innerHTML).to.equal("Hello Moon!");
    });
    it('should render when updated', function() {
      functionalApp.set('parentMsg', 'Changed');
      Moon.nextTick(function() {
        expect(document.getElementsByClassName("functionalComponent")[0].innerHTML).to.equal("Changed");
      });
    });

    describe("Slots", function() {
      it('should render the default slot', function() {
        Moon.nextTick(function() {
          expect(document.getElementsByClassName("functionalSlotComponent")[0].childNodes[0].innerHTML).to.equal("Default Slot Content");
        });
      });
      it('should render a named slot', function() {
        Moon.nextTick(function() {
          expect(document.getElementsByClassName("functionalSlotComponent")[0].childNodes[1].innerHTML).to.equal("<span>Named Slot Content</span>");
        });
      });
    });
});

describe("Events", function() {
  var bus = new Moon();
  var evt1 = false, evt1_2 = false, handler1, globalEvt = false;
  describe("Handler", function() {
    it("should create an event listener", function() {
      handler1 = function() {
        evt1 = true;
      }
      bus.on('evt1', handler1);
      expect(bus.$events.evt1[0]).to.be.a("function");
    });
    it("should create multiple event listeners", function() {
      bus.on('evt1', function() {
        evt1_2 = true;
      });
      expect(bus.$events.evt1[1]).to.be.a("function");
    });
    it("should create a global event listener", function() {
      bus.on('*', function() {
        globalEvt = true;
      });
      expect(bus.$events["*"][0]).to.be.a("function");
    });
  });

  describe("Emit", function() {
    it("should invoke all handlers", function() {
      bus.emit('evt1');
      expect(evt1).to.be.true;
      expect(evt1_2).to.be.true;
    });
    it("should call the global handler", function() {
      expect(globalEvt).to.be.true;
    });
  });

  describe("Removing", function() {
    it("should remove a handler", function() {
      bus.off('evt1', handler1);
      expect(bus.$events.evt1.length).to.equal(1);
    });
    it("should be able to remove all handlers", function() {
      bus.removeEvents();
      var allEvents = bus.$events.evt1.concat(bus.$events["*"])
      expect(allEvents.length).to.equal(0);
    });
  });
});


// describe('Component', function() {
//     createTestElement("component", '<my-component componentprop="{{parentMsg}}"></my-component>');
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
