describe("Extend Utility", function() {
  it("should extend an object", function() {
    expect(Moon.util.extend({a: true, b: true}, {a: true, b: false, c: true})).to.deep.equal({a: true, b: false, c: true});
  });
});
