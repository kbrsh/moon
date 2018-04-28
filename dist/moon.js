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

  var config = {
    silent: ("development" === "production") || (typeof console === "undefined")
  };

  var error = function (message) {
    if (config.silent === false) {
      console.error("[Moon] ERROR: " + message);
    }
  };

  var parseIndex;

  var pushChild = function (child, stack) {
    stack[stack.length - 1].children.push(child);
  };

  var parseOpeningTag = function (index, input, length, stack) {
    var type = "";

    for (; index < length; index++) {
      var char = input[index];

      if (char === ">") {
        var element = {
          index: parseIndex++,
          type: type,
          children: []
        };

        pushChild(element, stack);
        stack.push(element);

        index += 1;
        break;
      } else if (char === "/" && input[index + 1] === ">") {
        pushChild({
          index: parseIndex++,
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

      if (char === "<") {
        break;
      } else {
        content += char;
      }
    }

    pushChild({
      index: parseIndex++,
      type: "m-text",
      content: content
    }, stack);

    return index;
  };

  var parse = function (input) {
    var length = input.length;
    parseIndex = 0;

    var root = {
      children: []
    };

    var stack = [root];

    for (var i = 0; i < length;) {
      var char = input[i];

      if (char === "<") {
        if (input[i + 1] === "!" && input[i + 2] === "-" && input[i + 3] === "-") {
          i = parseComment(i + 4, input, length, stack);
        } else if (input[i + 1] === "/") {
          i = parseClosingTag(i + 2, input, length, stack);
        } else {
          i = parseOpeningTag(i + 1, input, length, stack);
        }
      } else {
        i = parseText(i, input, length, stack);
      }
    }

    return root.children;
  };

  var generateCreate = function (element) {
    if (Array.isArray(element)) {
      return element.map(generateCreate).join("");
    } else {
      switch (element.type) {
        case "m-text":
          return ("m[" + (element.index) + "] = document.createTextNode(\"" + (element.content) + "\");");
          break;
        default:
          return element.children.map(generateCreate).join("") + "m[" + (element.index) + "] = document.createElement(\"" + (element.type) + "\");";
      }
    }
  };

  var generateMount = function (element, parent) {
    var generatedMount = "";

    if (Array.isArray(element)) {
      var loop = function ( i ) {
        var child = element[i];
        var childPath = "m[" + (child.index) + "]";

        if (child.type !== "m-text") {
          generatedMount += child.children.map(function (grandchild) { return generateMount(grandchild, childPath); }).join("");
        }

        generatedMount += parent + ".parentNode.insertBefore(" + childPath + ", " + parent + ");";
      };

      for (var i = 0; i < element.length; i++) loop( i );
    } else {
      var elementPath = "m[" + (element.index) + "]";

      if (element.type !== "m-text") {
        generatedMount += element.children.map(function (child) { return generateMount(child, elementPath); }).join("");
      }

      generatedMount += parent + ".appendChild(" + elementPath + ");";
    }

    return generatedMount;
  };

  var generateUpdate = function () {};

  var generate = function (tree) {
    return new Function(("return [function () {var m = this.m;" + (generateCreate(tree)) + "}, function (root) {var m = this.m;" + (generateMount(tree, "root")) + "}, function () {var m = this.m;" + (generateUpdate(tree)) + "}]"))();
  };

  var compile = function (input) {
    return generate(parse(input));
  };

  function Moon(root, view) {
    if (typeof root === "string") {
      root = document.querySelector(root);
    }

    if (typeof view === "string") {
      view = compile(view);
    }

    var instance = {
      name: "@",
      data: {},
      create: view[0],
      mount: view[1],
      update: view[2],
      m: []
    };

    instance.create();
    instance.mount(root);
    root.parentNode.removeChild(root);

    return instance;
  }

  Moon.extend = function (name, view, data) {
    if (typeof view === "string") {
      view = compile(view);
    }
  };

  Moon.compile = compile;
  Moon.config = config;

  return Moon;
}));
