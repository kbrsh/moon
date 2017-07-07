describe('On Directive', function() {
  createTestElement("on", '<p id="on-count">{{count}}</p><button m-on:click="increment" id="on-increment-button">Increment</button><a id="on-modifier-link" href="https://kabir.ml" m-on:click.prevent="modifier">Link</a><button id="on-keycode-link" m-on:click.m="keycode"></button>');

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
    document.getElementById("on-increment-button").click();

    return wait(function() {
      expect(app.get('count')).to.equal(1);
    });
  });

  it('should update DOM', function() {
    document.getElementById("on-increment-button").click();
    return wait(function() {
      expect(document.getElementById("on-count").innerHTML).to.equal('2');
    });
  });

  it('should pass an event object', function() {
    expect(evt.target.tagName).to.equal('BUTTON');
  });

  it('should use modifiers', function() {
    document.getElementById("on-modifier-link").click();

    return wait(function() {
      expect(modifier_active).to.be['true'];
    });
  });

  it('should use custom keycodes', function() {
    var e = document.createEvent('HTMLEvents');
    e.initEvent("click", false, true);
    e.keyCode = 77;
    document.getElementById("on-keycode-link").dispatchEvent(e);

    return wait(function() {
      expect(keycode).to.be['true'];
    });
  });

  it('should not be present at runtime', function() {
    expect(document.getElementById('on-increment-button').getAttribute("m-on")).to.be['null'];
  });
});
