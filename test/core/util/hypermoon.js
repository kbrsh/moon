describe("HyperMoon Utility", function() {
  it("should create a vnode", function() {
    expect(Moon.util.m("h1", {attrs: {}}, {}, [])).to.deep.equal({type: "h1", props: {attrs: {}}, data: {}, children: []});
  });
});
