describe("HyperMoon Utility", function() {
  it("should create a vnode", function() {
    expect(Moon.util.m("h1", {attrs: {}}, {shouldRender: false}, [])).to.deep.equal({type: "h1", props: {attrs: {}}, meta: {shouldRender: false}, children: [], val: ""});
  });
});
