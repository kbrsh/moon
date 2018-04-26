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

  var pushChild = function (child, stack) {
    stack[stack.length - 1].children.push(child);
  };

  var parseOpeningTag = function (index, input, length, stack) {
    var type = "";

    for (; index < length; index++) {
      var char = input[index];

      if (char === ">") {
        var element = {
          type: type,
          children: []
        };

        pushChild(element, stack);
        stack.push(element);

        index += 1;
        break;
      } else if (char === "/" && input[index + 1] === ">") {
        pushChild({
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
      type: "m-text",
      content: content
    }, stack);

    return index;
  };

  var parse = function (input) {
    var length = input.length;

    var root = {
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

  var generate = function (tree) {};

  var compile = function (input) {
    return generate(parse(input));
  };

  function Moon() {

  }

  Moon.compile = compile;
  Moon.config = config;

  return Moon;
}));
