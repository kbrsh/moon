describe("Directive", function() {






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
        done();
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
      expect(document.getElementById('forList').childNodes[0].getAttribute("m-for")).to.be['null'];
    });
  });

  describe('Literal Directive', function() {
    createTestElement("literal", '<span m-literal:class="(num+1).toString()" id="literal-directive-span"></span>');
    createTestElement("literalClass", '<span m-literal:class="[\'1\', \'2\', \'3\']" id="literal-class-directive-span"></span>');
    createTestElement("literalConditionalClass", '<span m-literal:class="{trueVal: trueVal, falseVal: falseVal}" id="literal-conditional-class-directive-span"></span>');
    createTestElement("literalBooleanValue", '<span m-literal:disabled="condition" id="literal-boolean-value-directive-span"></span>');

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

    var literalBooleanValueApp = new Moon({
      el: "#literalBooleanValue",
      data: {
        condition: true
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

    it('should be able to handle a true boolean value', function() {
      expect(document.getElementById("literal-boolean-value-directive-span").getAttribute("disabled")).to.equal("");
    });

    it('should be able to handle a false boolean value', function() {
      literalBooleanValueApp.set('condition', false);
      Moon.nextTick(function() {
        expect(document.getElementById("literal-boolean-value-directive-span").getAttribute("disabled")).to.equal(null);
      })
    });

    it('should not be present at runtime', function() {
      expect(document.getElementById('literal-directive-span').getAttribute("m-literal")).to.be['null'];
    });
  });

  describe('HTML Directive', function() {
    createTestElement("html", '<span m-html="html" id="html-directive-span"></span>');

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

describe('Functional Component', function() {
    createTestElement("functional", '<functional-component someprop="{{parentMsg}}"></functional-component><slot-functional-component>Default Slot Content<span slot="named">Named Slot Content</span></slot-functional-component>');

    var functionalComponentDivProps = {attrs: {}};
    functionalComponentDivProps.attrs["class"] = "functionalComponent";
    Moon.component('functional-component', {
      functional: true,
      props: ['someprop'],
      render: function(m, ctx) {
        return m("h1", functionalComponentDivProps, {shouldRender: true}, [m("#text", {shouldRender: true}, ctx.data.someprop)]);
      }
    });

    var functionalComponentDivSlotProps = {attrs: {}};
    functionalComponentDivSlotProps.attrs["class"] = "functionalSlotComponent";
    Moon.component('slot-functional-component', {
      functional: true,
      render: function(m, ctx) {
        return m("div", functionalComponentDivSlotProps, {shouldRender: true}, [m("h1", {}, {shouldRender: true}, ctx.slots['default']), m("h1", {}, {shouldRender: true}, ctx.slots.named)]);
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
    createTestElement("componentData", '<data-component></data-component>');
    createTestElement("slotComponent", '<slot-component>{{parentMsg}}</slot-component>');
    createTestElement("namedSlotComponent", '<named-slot-component><h1 slot="named-slot">{{parentMsg}}</h1></named-slot-component>');

    var componentConstructor = Moon.component('my-component', {
      props: ['componentprop', 'otherprop'],
      template: "<div>{{componentprop}}</div>"
    });

    Moon.component('data-component', {
      template: "<div>{{msg}}</div>",
      data: function() {
        return {
          msg: "Hello Moon!"
        }
      }
    })

    Moon.component('slot-component', {
      template: "<div><slot></slot></div>"
    })

    Moon.component('named-slot-component', {
      template: "<div><slot name='named-slot'></slot></div>"
    })

    var componentDataApp = new Moon({
      el: "#componentData"
    });

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

    var componentApp = new Moon({
      el: "#component",
      data: {
        parentMsg: "Hello Moon!"
      }
    });

    it("should create a constructor", function() {
      expect(new componentConstructor()).to.be.an.instanceof(Moon);
    });

    it('should render HTML', function() {
      expect(document.getElementById("component")).to.not.be.null;
    });

    it('should render data from within the component state', function() {
      expect(document.getElementById("componentData").innerHTML).to.equal("<div>Hello Moon!</div>");
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
