// Tests
if(!chai) {
  var chai = require("chai");
}
if(!Moon) {
  var Moon = require("../../dist/moon.js");
}
if(document.getElementById("moon-els")) {
  var moon_els = document.getElementById("moon-els");
} else {
  var moon_els = document.createElement("div");
  moon_els.id = "moon-els";
  document.body.appendChild(moon_els);
}
var expect = chai.expect;
Moon.config.silent = true;
var createTestElement = function(id, html) {
  var el = document.createElement("div");
  el.innerHTML = html;
  el.id = id;
  moon_els.appendChild(el);
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

describe("Compiler", function() {
  it("should not compile comments", function() {
    var el = createTestElement("compilerComment", '<!-- comment -->');
    var compilerCommentApp = new Moon({
      el: "#compilerComment"
    });
    expect(el.innerHTML).to.equal("");
  });
  it("should compile self closing elements", function() {
    var el = createTestElement("compilerSelfClosing", '<self-closing/>');
    var compilerCommentApp = new Moon({
      el: "#compilerSelfClosing",
      template: "<div><self-closing/></div>"
    });
    expect(compilerCommentApp.$dom.children[0].type).to.equal("self-closing");
  });
  it("should compile only text", function() {
    var el = createTestElement("compilerOnlyText", '');
    var compilerCommentApp = new Moon({
      el: "#compilerOnlyText",
      template: "<div>text</div>"
    });
    expect(el.innerHTML).to.equal("text");
  });
  it("should double quotes in text", function() {
    var el = createTestElement("compilerDoubleQuote", '"Hello Moon!"');
    var compilerCommentApp = new Moon({
      el: "#compilerDoubleQuote"
    });
    expect(el.innerHTML).to.equal('"Hello Moon!"');
  });
  it("should compile an unclosed comment", function() {
    if(typeof console === 'undefined') {
      console = {}
    }
    if(console) {
      console.error = Moon.util.noop;
    }
    var el = createTestElement("compilerUnclosedComment", '');
    var compilerCommentApp = new Moon({
      el: "#compilerUnclosedComment",
      template: "<div><!-- unclosed</div>"
    });
    expect(el.innerHTML).to.equal("");
  });
});


describe('Data', function() {
  createTestElement("data", '{{msg}}');
  createTestElement("data2", '{{msg.obj.nested}}');
  createTestElement("data3", '{{msg.obj.nested}}');
  var dataApp = new Moon({
    el: "#data",
    data: {
      msg: "Hello Moon!"
    }
  });
  var dataApp2 = new Moon({
    el: "#data2",
    data: {
      msg: {
        obj: {
          nested: "Nested Object"
        }
      }
    }
  });
  var dataApp3 = new Moon({
    el: "#data3",
    data: {
      msg: {
        obj: {

        }
      }
    }
  });
  it('when initializing', function() {
    expect(document.getElementById("data").innerHTML).to.equal("Hello Moon!");
  });
  it('when setting', function(done) {
    dataApp.set('msg', 'New Value');
    Moon.nextTick(function() {
      expect(document.getElementById("data").innerHTML).to.equal("New Value");
      done();
    });
  });
  it('when setting new property', function(done) {
    dataApp3.set('msg.obj.nested', 'Nested Value');
    Moon.nextTick(function() {
      expect(document.getElementById("data3").innerHTML).to.equal("Nested Value");
      done();
    });
  });
  // it('when setting via setter', function() {
  //   dataApp.$data.msg = 'Second Value';
  //   Moon.nextTick(function() {
  //     expect(document.getElementById("data").innerHTML).to.equal("Second Value");
  //   });
  // });
  // it('when setting nested object via setter', function() {
  //   dataApp2.$data.msg.obj.nested = 'Nested Object';
  //   Moon.nextTick(function() {
  //     expect(document.getElementById("data2").innerHTML).to.equal("Nested Object");
  //   });
  // });
  // it('when setting new data property', function() {
  //   dataApp3.set("msg.obj.nested", "New Nested");
  //   Moon.nextTick(function() {
  //     expect(document.getElementById("data3").innerHTML).to.equal("New Nested");
  //   });
  // });
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

describe('Computed', function() {
  var computedAppEl = createTestElement("computed", '<p>{{msg}}</p><p>{{reversed}}</p>');
  var computedApp = new Moon({
    el: "#computed",
    data: {
      msg: "Message"
    },
    computed: {
      reversed: {
        get: function() {
          return this.get('msg').split("").reverse().join("");
        }
      }
    }
  });
  it('should compute at initial render', function() {
    expect(computedAppEl.childNodes[1].textContent).to.equal("egasseM");
  });
  it('should update when the message updates', function() {
    computedApp.set('msg', 'New');
    Moon.nextTick(function() {
      expect(computedAppEl.childNodes[1].textContent).to.equal('weN');
    });
  });
});

describe("Directive", function() {
  describe('Custom Directive', function() {
    createTestElement("customDirective", '<span m-square="2" id="custom-directive-span"></span>');
    Moon.directive("square", function(el, val, vdom) {
      var num = parseInt(val);
      vdom.children.push({
  	     type: "#text",
         meta: {
    	      shouldRender: true,
            component: false,
            eventListeners: []
          },
          val: String(num*num),
          props: {},
          children: []
        });
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
        expect(document.getElementById('if-condition')).to.be['null'];
      });
    });
    it('should not be present at runtime', function() {
      expect(document.getElementById('if-condition').getAttribute("m-if")).to.be['null'];
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
      expect(document.getElementById('show-condition').getAttribute("m-show")).to.be['null'];
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
      expect(document.getElementById('model-msg-input').getAttribute("m-model")).to.be['null'];
    });
  });

  describe('On Directive', function() {
    createTestElement("on", '<p id="on-count">{{count}}</p><button m-on:click="increment" id="on-increment-button">Increment</button><a id="on-modifier-link" href="https://kabir.ml" m-on:click.prevent="modifier">Link</a><button id="on-keycode-link" m-on:click.m="keycode"></button>');
    var evt, modifier_active, keycode;
    Moon.config.keyCodes({
      m: 77
    });
    var onApp = new Moon({
      el: "#on",
      data: {
        count: 0
      },
      methods: {
        increment: function(e) {
          onApp.set('count', onApp.get('count') + 1);
          evt = e;
        },
        modifier: function(e) {
          modifier_active = true;
        },
        keycode: function() {
          keycode = true;
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
    it('should use modifiers', function() {
      document.getElementById("on-modifier-link").click();
      expect(modifier_active).to.be['true'];
    });
    it('should use custom keycodes', function() {
      var e = document.createEvent('HTMLEvents');
      e.initEvent("click", false, true);
      e.keyCode = 77;
      document.getElementById("on-keycode-link").dispatchEvent(e);
      expect(keycode).to.be['true'];
    });
    it('should not be present at runtime', function() {
      expect(document.getElementById('on-increment-button').getAttribute("m-on")).to.be['null'];
    });
  });

  describe('For Directive', function() {
    createTestElement("for", "<ul id='forList'><li m-for='item in {{items}}'>{{item}}</li></ul>");
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
      expect(document.getElementById('forList').childNodes[0].getAttribute("m-for")).to.be['null'];
    });
  });

  describe('Literal Directive', function() {
    createTestElement("literal", '<span m-literal:class="({{num}}+1).toString()" id="literal-directive-span"></span>');
    createTestElement("literalClass", '<span m-literal:class="[\'1\', \'2\', \'3\']" id="literal-class-directive-span"></span>');
    createTestElement("literalConditionalClass", '<span m-literal:class="{trueVal: {{trueVal}}, falseVal: {{falseVal}}}" id="literal-conditional-class-directive-span"></span>');
    var literalApp = new Moon({
      el: "#literal",
      data: {
        num: 1
      }
    });
    var literalClassApp = new Moon({
      el: "#literalClass"
    });
    var literalConditionalClassApp = new Moon({
      el: "#literalConditionalClass",
      data: {
        trueVal: true,
        falseVal: false
      }
    });
    it('should treat the value as a literal expression', function() {
      expect(document.getElementById("literal-directive-span").getAttribute("class")).to.equal("2");
    });
    it('should be able to handle an array of classes', function() {
      expect(document.getElementById("literal-class-directive-span").getAttribute("class")).to.equal("1 2 3");
    });
    it('should be able to handle an object of conditional classes', function() {
      expect(document.getElementById("literal-conditional-class-directive-span").getAttribute("class")).to.equal("trueVal");
    });
    it('should not be present at runtime', function() {
      expect(document.getElementById('literal-directive-span').getAttribute("m-literal")).to.be['null'];
    });
  });

  describe('HTML Directive', function() {
    createTestElement("html", '<span m-html="{{html}}" id="html-directive-span"></span>');
    var htmlApp = new Moon({
      el: "#html",
      data: {
        html: "<strong>Hello Moon!</strong>"
      }
    });
    it('should fill DOM with a value', function() {
      expect(document.getElementById("html-directive-span").innerHTML).to.equal("<strong>Hello Moon!</strong>");
    });
    it('should not be present at runtime', function() {
      expect(document.getElementById('html-directive-span').getAttribute("m-html")).to.be['null'];
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
      expect(document.getElementById('text-directive-span').getAttribute("m-text")).to.be['null'];
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
      expect(document.getElementById('once-directive-span').getAttribute("m-once")).to.be['null'];
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
  });

  describe('Mask Directive', function() {
    createTestElement("mask", '<span m-mask id="mask-directive-span">{{msg}}</span>');
    var maskApp = new Moon({
      el: "#mask",
      data: {
        msg: "Hello Moon!"
      }
    });
    it('should not be present at runtime', function() {
      expect(document.getElementById('mask-directive-span').getAttribute("m-mask")).to.be['null'];
    });
  });
});

describe('Plugin', function() {
  createTestElement("plugin", '<span m-empty id="plugin-span">{{msg}}</span>');
  var emptyPlugin = {
    init: function(Moon) {
      Moon.directive('empty', function(el, val, vdom) {
        el.innerHTML = "";
        vdom.children[0].val = "";
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
        return h('div', {attrs: {id: "render"}}, null, this.get('msg'))
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
    var functionalComponentDivProps = {attrs: {}};
    functionalComponentDivProps.attrs["class"] = "functionalComponent";
    Moon.component('functional-component', {
      functional: true,
      props: ['someprop'],
      render: function(h, ctx) {
        return h("h1", functionalComponentDivProps, null, ctx.data.someprop);
      }
    });
    var functionalComponentDivSlotProps = {attrs: {}};
    functionalComponentDivSlotProps.attrs["class"] = "functionalSlotComponent";
    Moon.component('slot-functional-component', {
      functional: true,
      render: function(h, ctx) {
        return h("div", functionalComponentDivSlotProps, null, h("h1", {}, null, ctx.slots["default"]), h("h1", {}, null, ctx.slots.named));
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

describe('Component', function() {
    createTestElement("component", '<my-component componentprop="{{parentMsg}}"></my-component>');
    createTestElement("slotComponent", '<slot-component>{{parentMsg}}</slot-component>');
    createTestElement("namedSlotComponent", '<named-slot-component><h1 slot="named-slot">{{parentMsg}}</h1></named-slot-component>');
    var componentConstructor = Moon.component('my-component', {
      props: ['componentprop', 'otherprop'],
      template: "<div>{{componentprop}}</div>"
    });

    Moon.component('slot-component', {
      template: "<div><slot></slot></div>"
    })

    Moon.component('named-slot-component', {
      template: "<div><slot name='named-slot'></slot></div>"
    })

    var slotComponentApp = new Moon({
      el: "#slotComponent",
      data: {
        parentMsg: "Hello Moon!"
      }
    });

    var namedSlotComponentApp = new Moon({
      el: "#namedSlotComponent",
      data: {
        parentMsg: "Hello Moon!"
      }
    });

    it("should create a constructor", function() {
      expect(new componentConstructor()).to.be.an.instanceof(Moon);
    });
    var componentApp = new Moon({
      el: "#component",
      data: {
        parentMsg: "Hello Moon!"
      }
    });
    it('should render HTML', function() {
      expect(document.getElementById("component")).to.not.be.null;
    });
    it('should render with props', function() {
      expect(document.getElementById("component").innerHTML).to.equal("<div>Hello Moon!</div>");
    });
    it('should render when updated', function() {
      componentApp.set('parentMsg', 'Changed');
      Moon.nextTick(function() {
        expect(document.getElementById("component").innerHTML).to.equal("<div>Changed</div>");
      });
    });
    it('should render slots', function() {
      expect(document.getElementById("slotComponent").innerHTML).to.equal("<div>Hello Moon!</div>");
    });
    it('should render slots when updated', function() {
      slotComponentApp.set('parentMsg', 'Changed');
      Moon.nextTick(function() {
        expect(document.getElementById("slotComponent").innerHTML).to.equal("<div>Changed</div>");
      });
    });
    it('should render named slots', function() {
      expect(document.getElementById("namedSlotComponent").innerHTML).to.equal("<div><h1>Hello Moon!</h1></div>");
    });
    it('should render named slots when updated', function() {
      namedSlotComponentApp.set('parentMsg', 'Changed');
      Moon.nextTick(function() {
        expect(document.getElementById("namedSlotComponent").innerHTML).to.equal("<div><h1>Changed</h1></div>");
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
      expect(evt1).to.be['true'];
      expect(evt1_2).to.be['true'];
    });
    it("should call the global handler", function() {
      expect(globalEvt).to.be['true'];
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

describe("Optimization", function() {
  it("should not rerender static nodes", function() {
    createTestElement("staticOptimization", "<h1>Static</h1>");
    var staticOptimizationApp = new Moon({
      el: "#staticOptimization"
    });
    expect(staticOptimizationApp.render().children[0].meta.shouldRender).to.equal(false);
  });
});

describe("Utilities", function() {
  it("should extend an object", function() {
    expect(Moon.util.extend({a: true, b: true}, {a: true, b: false, c: true})).to.deep.equal({a: true, b: false, c: true});
  });
});
