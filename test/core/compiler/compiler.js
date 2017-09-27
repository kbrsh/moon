describe("Compiler", function() {
  it("should compile whitespace in templates", function() {
    var el = createTestElement("compilerTemplateWhitespace", '{{  msg   }}');
    var app = new Moon({
      root: "#compilerTemplateWhitespace",
      data: {
        msg: "Hello Moon!"
      }
    });
    expect(el.innerHTML).to.equal("Hello Moon!");
  });

  it("should compile unclosed templates", function() {
    createTestElement("compilerTemplateUnclosed", '{{msg');
    new Moon({
      root: "#compilerTemplateUnclosed"
    });
  });

  it("should not compile invalid expressions", function() {
    var fail = false;
    console.error = function() {
      fail = true;
      console.error = noop;
    }

    Moon.compile("<div>{{ #invalid }}</div>");
    expect(fail).to.be["true"];
  });

  it("should not compile comments", function() {
    var el = createTestElement("compilerComment", '<!-- comment -->');
    var compilerCommentApp = new Moon({
      root: "#compilerComment"
    });
    expect(el.innerHTML).to.equal("");
  });

  it("should compile self closing elements", function() {
    var el = createTestElement("compilerSelfClosing", '<self-closing/>');
    var app = new Moon({
      root: "#compilerSelfClosing",
      template: "<div><self-closing/></div>"
    });
    expect(app.dom.children[0].type).to.equal("self-closing");
  });

  it("should compile self closing elements without a slash and consume children", function() {
    var el = createTestElement("compilerSelfClosingNoSlash", '');
    var app = new Moon({
      root: "#compilerSelfClosingNoSlash",
      template: "<div><self-closing>Foo</div>"
    });
    expect(app.dom.children[0].children[0].value).to.equal("Foo");
  });

  it("should ignore just closing elements", function() {
    var el = createTestElement("compilerJustClosing", '');
    var app = new Moon({
      root: "#compilerJustClosing",
      template: "<div></h1></div>"
    });
    expect(app.dom.children[0]).to.equal(undefined);
  });

  it("should ignore just closing custom elements", function() {
    var el = createTestElement("compilerJustClosingCustom", '');
    var app = new Moon({
      root: "#compilerJustClosingCustom",
      template: "<div></custom></div>"
    });
    expect(app.dom.children[0]).to.equal(undefined);
  });

  it("should compile only text", function() {
    var el = createTestElement("compilerOnlyText", '');
    var compilerCommentApp = new Moon({
      root: "#compilerOnlyText",
      template: "<div>text</div>"
    });
    expect(el.innerHTML).to.equal("text");
  });

  it("should compile double quotes in text", function() {
    var el = createTestElement("compilerDoubleQuote", '"Hello Moon!"');
    var compilerCommentApp = new Moon({
      root: "#compilerDoubleQuote"
    });
    expect(el.innerHTML).to.equal('"Hello Moon!"');
  });

  it("should compile an unclosed comment", function() {
    var el = createTestElement("compilerUnclosedComment", '');
    var compilerCommentApp = new Moon({
      root: "#compilerUnclosedComment",
      template: "<div><!-- unclosed</div>"
    });
    expect(el.innerHTML).to.equal("");
  });

  it("should compile an unclosed tag", function() {
    var el = createTestElement("compilerUnclosedTag", '');
    var compilerUnclosedTagApp = new Moon({
      root: "#compilerUnclosedTag",
      template: "<div><h1>Moon</div>"
    });
    expect(el.firstChild.textContent).to.equal("Moon");
  });

  it("should compile attributes with no value", function() {
    var el = createTestElement("compilerEmptyAttributes", '<div test></div>');
    new Moon({
      root: "#compilerEmptyAttributes"
    });
    expect(el.firstChild.getAttribute("test")).to.equal("");
  });

  it("should compile and mark SVG elements", function() {
    var el = createTestElement("compilerSVG", '');
    var app = new Moon({
      root: "#compilerSVG",
      template: '<div id="compilerSVG"><svg><defs><g id="TestLink"><circle/></g></defs><use xlink:href="#TestLink"></use></svg></div>'
    });

    var use = el.firstChild.firstChild.nextSibling;
    expect(use.getAttribute("xlink:href") || use.getAttribute("href")).to.equal("#TestLink");
    expect(app.render().children[0].data.SVG).to.equal(1);
  });
});
