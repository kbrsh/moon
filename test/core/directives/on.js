describe('On Directive', function() {
  var on = createTestElement("on", '<p>{{count}}</p><button m-on:click="increment">Increment</button><a href="https://kabir.ml" m-on:click.prevent="modifier">Link</a><button m-on:click.m="keycode"></button>');
  var p = on.firstChild;
  var button = p.nextSibling;
  var a = button.nextSibling;
  var buttonKeycode = a.nextSibling;

  var evt, modifier_active, keycode;
  Moon.config.keyCodes({
    m: 77
  });

  var app = new Moon({
    el: "#on",
    data: {
      count: 0
    },
    methods: {
      increment: function(e) {
        this.set('count', this.get('count') + 1);
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
    button.click();

    return wait(function() {
      expect(app.get('count')).to.equal(1);
    });
  });

  it('should update DOM', function() {
    button.click();
    return wait(function() {
      expect(p.innerHTML).to.equal('2');
    });
  });

  it('should pass an event object', function() {
    expect(evt.target.tagName).to.equal('BUTTON');
  });

  it('should use modifiers', function() {
    a.click();

    return wait(function() {
      expect(modifier_active).to.be['true'];
    });
  });

  it('should use custom keycodes', function() {
    var e = document.createEvent('HTMLEvents');
    e.initEvent("click", false, true);
    e.keyCode = 77;
    buttonKeycode.dispatchEvent(e);

    return wait(function() {
      expect(keycode).to.be['true'];
    });
  });

  it('should not be present at runtime', function() {
    expect(button.getAttribute("m-on")).to.be['null'];
    expect(a.getAttribute("m-on")).to.be['null'];
    expect(buttonKeycode.getAttribute("m-on")).to.be['null'];
  });
});
