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

  var expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)/g;

  var parseTemplate = function (expression, dependencies, locals) {
    var info, dynamic = false;

    while ((info = expressionRE.exec(expression)) !== null) {
      var name = info[1];
      if (name !== undefined && locals.indexOf(name) === -1) {
        dependencies.push(name);
        dynamic = true;
      }
    }

    return dynamic;
  };

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

  var whitespaceRE = /\s/;

  var parseAttributes = function (index, input, length, attributes, dependencies, locals) {
    while (index < length) {
      var char = input[index];

      if (char === "/" || char === ">") {
        break;
      } else if (whitespaceRE.test(char)) {
        index += 1;
        continue;
      } else {
        var key = "";
        var argument = "";
        var value = "";
        var expression = false;

        while (index < length) {
          char = input[index];

          if (char === "/" || char === ">" || whitespaceRE.test(char)) {
            value = key;
            break;
          } else if (char === "=") {
            index += 1;
            break;
          } else if (char === ":" && key[0] === "m" && key[1] === "-") {
            argument += input[index + 1];
            index += 2;
          } else if (argument.length !== 0) {
            argument += char;
            index += 1;
          } else {
            key += char;
            index += 1;
          }
        }

        if (value.length === 0) {
          var quote = (void 0);
          char = input[index];

          if (char === "\"" || char === "'") {
            quote = char;
            index += 1;
          } else if (char === "{") {
            quote = "}";
            expression = true;
            index += 1;
          } else {
            quote = whitespaceRE;
          }

          while (index < length) {
            char = input[index];

            if (char === "/" || char === ">") {
              break;
            } else if ((typeof quote === "object" && quote.test(char)) || char === quote) {
              index += 1;
              break;
            } else {
              value += char;
              index += 1;
            }
          }
        }

        attributes.push({
          key: key,
          value: value,
          argument: argument,
          expression: expression,
          dynamic: expression && parseTemplate(value, dependencies, locals)
        });
      }
    }

    return index;
  };

  var parseOpeningTag = function (index, input, length, stack, dependencies, locals) {
    var type = "";
    var attributes = [];

    while (index < length) {
      var char = input[index];

      if (char === ">") {
        var element = {
          index: stack.parseIndex++,
          type: type,
          attributes: attributes,
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
          attributes: attributes,
          children: []
        }, stack);

        index += 2;
        break;
      } else if (whitespaceRE.test(char)) {
        attributes = [];
        index = parseAttributes(index + 1, input, length, attributes, dependencies, locals);
      } else {
        type += char;
        index += 1;
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

    pushChild({
      index: stack.parseIndex++,
      type: "m-expression",
      content: expression,
      dynamic: parseTemplate(expression, dependencies, locals)
    }, stack);

    return index;
  };

  var parse = function (input) {
    var length = input.length;
    var dependencies = [];
    var locals = ["NaN", "event", "false", "in", "null", "this", "true", "typeof", "undefined"];

    var root = {
      type: "m-fragment",
      attributes: [],
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
          i = parseOpeningTag(i + 1, input, length, stack, dependencies, locals);
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

  var attributeValue = function (attribute) { return attribute.expression ? attribute.value : ("\"" + (attribute.value) + "\""); };

  var generateCreateAttributes = function (element) { return mapReduce(element.attributes, function (attribute) {
    var key = attribute.key;

    switch (key) {
      case "m-for":
        break;
      case "m-if":
        break;
      case "m-on":
        return ("m[" + (element.index) + "].addEventListener(\"" + (attribute.argument) + "\", function(event){" + (attributeValue(attribute)) + "});");
        break;
      default:
        return ("m[" + (element.index) + "].setAttribute(\"" + key + "\"," + (attributeValue(attribute)) + ");");
    }
  }); };

  var generateCreate = function (element) {
    switch (element.type) {
      case "m-fragment":
        return mapReduce(element.children, generateCreate);
        break;
      case "m-expression":
        return ("m[" + (element.index) + "]=m.ct(" + (element.content) + ");");
        break;
      case "m-text":
        return ("m[" + (element.index) + "]=m.ct(\"" + (element.content) + "\");");
        break;
      default:
        return ((mapReduce(element.children, generateCreate)) + "m[" + (element.index) + "]=m.ce(\"" + (element.type) + "\");" + (generateCreateAttributes(element)));
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

        generatedMount += "m.ma(" + elementPath + "," + parent + ");";
    }

    return generatedMount;
  };

  var generateUpdateAttributes = function (element) { return mapReduce(element.attributes, function (attribute) {
    if (attribute.dynamic) {
      var key = attribute.key;

      switch (key) {
        case "m-for":
          break;
        case "m-if":
          break;
        case "m-on":
          return "";
          break;
        default:
          return ("m[" + (element.index) + "].setAttribute(\"" + key + "\"," + (attribute.value) + ");");
      }
    } else {
      return "";
    }
  }); };

  var generateUpdate = function (element) {
    switch (element.type) {
      case "m-expression":
        return element.dynamic ? ("m.ut(m[" + (element.index) + "]," + (element.content) + ");") : "";
        break;
      case "m-text":
        return "";
        break;
      default:
        return generateUpdateAttributes(element) + mapReduce(element.children, generateUpdate);
    }
  };

  var generate = function (tree) {
    var prelude = "var m=this.m;" + mapReduce(tree.dependencies, function (dependency) { return ("var " + dependency + "=this.data." + dependency + ";"); });
    return new Function(("return [function(){" + prelude + (generateCreate(tree)) + "},function(root){var m=this.m;" + (generateMount(tree, "root")) + "},function(){" + prelude + (generateUpdate(tree)) + "}]"))();
  };

  var compile = function (input) {
    return generate(parse(input));
  };

  var components = {};

  var createElement = function (type) { return document.createElement(type); };
  var createTextNode = function (content) { return document.createTextNode(content); };

  var mountAppendChild = function (element, parent) {
    parent.appendChild(element);
  };

  var updateTextContent = function (element, content) {
    element.textContent = content;
  };

  var m = function () {
    var m = [];
    m.c = components;
    m.ce = createElement;
    m.ct = createTextNode;
    m.ma = mountAppendChild;
    m.ut = updateTextContent;
    return m;
  };

  var set = function (key, value) {
    var this$1 = this;

    if (typeof key === "object") {
      for (var childKey in key) {
        this$1.set(childKey, key[childKey]);
      }
    } else {
      this.data[key] = value;

      if (this.queued === false) {
        this.queued = true;

        var instance = this;
        setTimeout(function () {
          instance.update();
          instance.queued = false;
        }, 0);
      }
    }
  };

  var component = function (name, view, data) {
    return function MoonComponent() {
      var this$1 = this;

      this.name = name;
      this.data = data();
      this.queued = false;
      this.create = view[0];
      this.mount = view[1];
      this.update = view[2];
      this.set = set;
      this.m = m();

      var actions = this.data.actions;
      for (var action in actions) {
        actions[action] = actions[action].bind(this$1);
      }
    };
  };

  function Moon(root, view, data) {
    if (typeof root === "string") {
      root = document.querySelector(root);
    }

    if (typeof view === "string") {
      view = compile(view);
    }

    if (data === undefined) {
      data = function () { return {}; };
    } else if (typeof data === "object") {
      var dataObj = data;
      data = function () { return dataObj; };
    }

    var rootComponent = component("m-root", view, data);
    var instance = new rootComponent();

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

    components[name] = component(name, view, data);
  };

  Moon.compile = compile;
  Moon.config = config;

  return Moon;
}));
