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
      error(("Unclosed tag \"" + (lastElement.type) + "\", expected \"" + type + "\""));
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
      index: parseIndex++,
      type: "m-fragment",
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

    return root;
  };

  var generateCreateFragment = function (element) {
    return ((element.children.map(generateCreate)) + " m[" + (element.index) + "] = []; ");
  };

  var generateCreateText = function (element) {};

  var generateCreateElement = function (element) {
    return (" m[" + (element.index) + "] = document.createElement(\"" + (element.type) + "\");");
  };

  var generateCreate = function (element) {
    switch (element.type) {
      case "m-fragment":
        return generateCreateFragment(element);
        break;
      case "m-text":
        return generateCreateText(element);
        break;
      default:
        return generateCreateElement(element);
    }
  };

  var generateUpdate = function () {};

  var generate = function (tree) {
    var prelude = "var data = instance.data; var m = instance.m;";
    return new Function(("return [function (instance) {" + prelude + (generateCreate(tree)) + "}, function (instance) {" + prelude + (generateUpdate(tree)) + "}]"))();
  };

  var compile = function (input) {
    return generate(parse(input));
  };

  function Moon(element, view) {
    if (typeof element === "string") {
      element = document.querySelector(element);
    }

    if (typeof view === "string") {
      view = compile(view);
    }

    view[0]();
    view[1]();
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
