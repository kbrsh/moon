describe("Compiler", function() {
  it("should compile whitespace in mustaches", function() {
    var el = createTestElement("compilerMustacheWhitespace", '{{  msg   }}');
    var app = new Moon({
      el: "#compilerMustacheWhitespace",
      data: {
        msg: "Hello Moon!"
      }
    });
    expect(el.innerHTML).to.equal("Hello Moon!");
  });

  it("should not compile comments", function() {
    var el = createTestElement("compilerComment", '<!-- comment -->');
    var compilerCommentApp = new Moon({
      el: "#compilerComment"
    });
    expect(el.innerHTML).to.equal("");
  });

  it("should compile self closing elements", function() {
    var el = createTestElement("compilerSelfClosing", '<self-closing/>');
    var app = new Moon({
      el: "#compilerSelfClosing",
      template: "<div><self-closing/></div>"
    });
    expect(app.$dom.children[0].type).to.equal("self-closing");
  });

  it("should compile self closing elements without a slash and consume children", function() {
    var el = createTestElement("compilerSelfClosingNoSlash", '');
    var app = new Moon({
      el: "#compilerSelfClosingNoSlash",
      template: "<div><self-closing>hi</div>"
    });
    expect(app.$dom.children[0].children[0].val).to.equal("hi");
  });

  it("should ignore just closing elements", function() {
    var el = createTestElement("compilerJustClosing", '');
    var app = new Moon({
      el: "#compilerJustClosing",
      template: "<div></h1></div>"
    });
    expect(app.$dom.children[0]).to.equal(undefined);
  });

  it("should ignore just closing custom elements", function() {
    var el = createTestElement("compilerJustClosingCustom", '');
    var app = new Moon({
      el: "#compilerJustClosingCustom",
      template: "<div></custom></div>"
    });
    expect(app.$dom.children[0]).to.equal(undefined);
  });

  it("should compile only text", function() {
    var el = createTestElement("compilerOnlyText", '');
    var compilerCommentApp = new Moon({
      el: "#compilerOnlyText",
      template: "<div>text</div>"
    });
    expect(el.innerHTML).to.equal("text");
  });

  it("should compile double quotes in text", function() {
    var el = createTestElement("compilerDoubleQuote", '"Hello Moon!"');
    var compilerCommentApp = new Moon({
      el: "#compilerDoubleQuote"
    });
    expect(el.innerHTML).to.equal('"Hello Moon!"');
  });

  it("should compile an unclosed comment", function() {
    var el = createTestElement("compilerUnclosedComment", '');
    var compilerCommentApp = new Moon({
      el: "#compilerUnclosedComment",
      template: "<div><!-- unclosed</div>"
    });
    expect(el.innerHTML).to.equal("");
  });

  it("should compile an unclosed tag", function() {
    var el = createTestElement("compilerUnclosedTag", '');
    var compilerUnclosedTagApp = new Moon({
      el: "#compilerUnclosedTag",
      template: "<div><h1>Moon</div>"
    });
    expect(el.firstChild.textContent).to.equal("Moon");
  });
});
