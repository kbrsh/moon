/**
 * Moon v1.0.0-alpha
 * Copyright 2016-2018 Kabir Shah
 * Released under the MIT License
 * https://kbrsh.github.io/moon
 */
(function(root, factory) {
  if (typeof module === "undefined") {
    root.Moon = factory();
  } else {
    module.exports = factory();
  }
}(this, function() {
  "use strict";

  var parseComment = function (index, input, length) {
    while (index < length) {
      var char0 = input[index];
      var char1 = input[index + 1];
      var char2 = input[index + 2];

      if (char0 === "<" && char1 === "!" && char2 === "-" && input[index + 3] === "-") {
        index = parseComment(index + 4, input, length);
      } else if (char0 === "-" && char1 === "-" && char2 === ">") {
        index += 3;
        break;
      } else {
        index += 1;
      }
    }

    return index;
  };

  var config = {
    silent: ("development" === "production") || (typeof console === "undefined")
  };

  var error = function (message) {
    if (config.silent === false) {
      console.error("[Moon] ERROR: " + message);
    }
  };

  var expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)/g;
  var escapeRE = /(?:(?:&(?:amp|gt|lt|nbsp|quot);)|"|\\|\n)/g;
  var escapeMap = {
    "&amp;": '&',
    "&gt;": '>',
    "&lt;": '<',
    "&nbsp;": ' ',
    "&quot;": "\\\"",
    '\\': "\\\\",
    '"': "\\\"",
    '\n': "\\n"
  };

  var pushChild = function (child, stack) {
    stack[stack.length - 1].children.push(child);
  };

  var parseOpeningTag = function (index, input, length, stack) {
    var type = "";

    for (; index < length; index++) {
      var char = input[index];

      if (char === ">") {
        var element = {
          index: stack.parseIndex++,
          type: type,
          children: []
        };

        pushChild(element, stack);
        stack.push(element);

        index += 1;
        break;
      } else if (char === "/" && input[index + 1] === ">") {
        pushChild({
          index: stack.parseIndex++,
          type: type,
          children: []
        }, stack);

        index += 2;
        break;
      } else {
        type += char;
      }
    }

    return index;
  };

  var parseClosingTag = function (index, input, length, stack) {
    var type = "";

    for(; index < length; index++) {
      var char = input[index];

      if (char === ">") {
        index += 1;
        break;
      } else {
        type += char;
      }
    }

    var lastElement = stack.pop();
    if (type !== lastElement.type && "development" === "development") {
      error(("Unclosed tag \"" + (lastElement.type) + "\""));
    }

    return index;
  };

  var parseText = function (index, input, length, stack) {
    var content = "";

    for (; index < length; index++) {
      var char = input[index];

      if (char === "<" || char === "{") {
        break;
      } else {
        content += char;
      }
    }

    pushChild({
      index: stack.parseIndex++,
      type: "m-text",
      content: content.replace(escapeRE, function (match) { return escapeMap[match]; })
    }, stack);

    return index;
  };

  var parseExpression = function (index, input, length, stack, dependencies, locals) {
    var expression = "";

    for (; index < length; index++) {
      var char = input[index];

      if (char === "}") {
        index += 1;
        break;
      } else {
        expression += char;
      }
    }

    var info;
    while ((info = expressionRE.exec(expression)) !== null) {
      var name = info[1];
      if (name !== undefined && locals.indexOf(name) === -1) {
        dependencies.push(name);
      }
    }

    pushChild({
      index: stack.parseIndex++,
      type: "m-expression",
      content: expression
    }, stack);

    return index;
  };

  var parse = function (input) {
    var length = input.length;
    var dependencies = [];
    var locals = ["NaN", "false", "in", "m", "null", "true", "typeof", "undefined"];

    var root = {
      type: "m-fragment",
      children: [],
      dependencies: dependencies
    };

    var stack = [root];
    stack.parseIndex = 0;

    for (var i = 0; i < length;) {
      var char = input[i];

      if (char === "<") {
        if (input[i + 1] === "!" && input[i + 2] === "-" && input[i + 3] === "-") {
          i = parseComment(i + 4, input, length);
        } else if (input[i + 1] === "/") {
          i = parseClosingTag(i + 2, input, length, stack);
        } else {
          i = parseOpeningTag(i + 1, input, length, stack);
        }
      } else if (char === "{") {
        i = parseExpression(i + 1, input, length, stack, dependencies, locals);
      } else {
        i = parseText(i, input, length, stack);
      }
    }

    return root;
  };

  var mapReduce = function (arr, fn) { return arr.reduce(function (result, current) { return result + fn(current); }, ""); };

  var generateCreate = function (element) {
    switch (element.type) {
      case "m-fragment":
        return mapReduce(element.children, generateCreate);
        break;
      case "m-expression":
        return ("m[" + (element.index) + "] = m.ct(" + (element.content) + ");");
        break;
      case "m-text":
        return ("m[" + (element.index) + "] = m.ct(\"" + (element.content) + "\");");
        break;
      default:
        return ((mapReduce(element.children, generateCreate)) + "m[" + (element.index) + "] = m.ce(\"" + (element.type) + "\");");
    }
  };

  var generateMount = function (element, parent) {
    var generatedMount = "";

    switch (element.type) {
      case "m-fragment":
        return mapReduce(element.children, function (child) { return generateMount(child, parent); });
        break;
      default:
        var elementPath = "m[" + (element.index) + "]";

        if (element.type !== "m-text" && element.type !== "m-expression") {
          generatedMount += mapReduce(element.children, function (child) { return generateMount(child, elementPath); });
        }

        generatedMount += "m.ma(" + elementPath + ", " + parent + ");";
    }

    return generatedMount;
  };

  var generateUpdate = function (element) {
    switch (element.type) {
      case "m-expression":
        return ("m.ut(m[" + (element.index) + "], " + (element.content) + ");");
        break;
      case "m-text":
        return "";
        break;
      default:
        return mapReduce(element.children, generateUpdate);
    }
  };

  var generate = function (tree) {
    var prelude = "var m = this.m; " + mapReduce(tree.dependencies, function (dependency) { return ("var " + dependency + " = this.data." + dependency + ";"); });
    return new Function(("return [function () {" + prelude + (generateCreate(tree)) + "}, function (root) {var m = this.m;" + (generateMount(tree, "root")) + "}, function () {var m = this.m;" + prelude + (generateUpdate(tree)) + "}]"))();
  };

  var compile = function (input) {
    return generate(parse(input));
  };

  var createElement = function (type) { return document.createElement(type); };
  var createTextNode = function (content) { return document.createTextNode(content); };

  var mountAppendChild = function (element, parent) {
    parent.appendChild(element);
  };

  var updateTextContent = function (element, content) {
    element.textContent = content;
  };

  var newM = function () {
    var m = [];
    m.ce = createElement;
    m.ct = createTextNode;
    m.ma = mountAppendChild;
    m.ut = updateTextContent;
    return m;
  };

  function Moon(root, view, data) {
    if (typeof root === "string") {
      root = document.querySelector(root);
    }

    if (typeof view === "string") {
      view = compile(view);
    }

    if (data === undefined) {
      data = {};
    }

    var instance = {
      name: "m-root",
      data: data,
      create: view[0],
      mount: view[1],
      update: view[2],
      m: newM()
    };

    instance.create();
    instance.mount(root);

    return instance;
  }

  Moon.extend = function (name, view, data) {
    if (typeof view === "string") {
      view = compile(view);
    }

    if (data === undefined) {
      data = function () {
        return {};
      };
    }
  };

  Moon.compile = compile;
  Moon.config = config;

  return Moon;
}));
