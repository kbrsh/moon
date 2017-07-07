describe('Computed', function() {
  var computed = createTestElement("computed", '<p>{{msg}}</p><p>{{reversed}}</p>');

  var app = new Moon({
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
    return wait(function() {
      expect(computed.childNodes[1].textContent).to.equal("egasseM");
    });
  });

  it('should update when the message updates', function() {
    app.set('msg', 'New');
    return wait(function() {
      expect(computed.childNodes[1].textContent).to.equal('weN');
    });
  });
});
