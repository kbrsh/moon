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
      bus.off();
      expect(bus.$events).to.deep.equal({});
    });
  });
});
