

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
