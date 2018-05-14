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

  var generateCreate = function (element, parent) {
    switch (element.type) {
      case "m-fragment":
        return mapReduce(element.children, function (child) { return generateCreate(child, parent); });
        break;
      case "m-expression":
        return ("m[" + (element.index) + "]=m.ct(" + (element.content) + ");m.ca(m[" + (element.index) + "]," + parent + ");");
        break;
      case "m-text":
        return ("m[" + (element.index) + "]=m.ct(\"" + (element.content) + "\");m.ca(m[" + (element.index) + "]," + parent + ");");
        break;
      default:
        return ("m[" + (element.index) + "]=m.ce(\"" + (element.type) + "\");" + (generateCreateAttributes(element)) + "m.ca(m[" + (element.index) + "], " + parent + ");" + (mapReduce(element.children, function (child) { return generateCreate(child, ("m[" + (element.index) + "]")); })));
    }
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
    return new Function(("return [function(root){" + prelude + (generateCreate(tree, "root")) + "},function(){" + prelude + (generateUpdate(tree)) + "}]"))();
  };

  var compile = function (input) {
    return generate(parse(input));
  };

  var components = {};

  var createElement = function (type) { return document.createElement(type); };
  var createTextNode = function (content) { return document.createTextNode(content); };
  var createAppendChild = function (element, parent) {
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
    m.ca = createAppendChild;
    m.ut = updateTextContent;
    return m;
  };

  var build = function() {
    if (this.queued === false) {
      this.queued = true;

      var instance = this;
      setTimeout(function () {
        instance.view[1]();
        instance.queued = false;
        instance.emit("updated");
      }, 0);
    }
  };

  var set = function(key, value) {
    var this$1 = this;

    if (typeof key === "object") {
      for (var childKey in key) {
        this$1.set(childKey, key[childKey]);
      }
    } else {
      this.data[key] = value;
      this.build();
    }
  };

  var on = function(type, handler) {
    var data = this.data;
    var handlers = data[type];

    if (handlers === undefined) {
      data[type] = handler;
    } else if (typeof handlers === "function") {
      data[type] = [handlers, handler];
    } else {
      handlers.push(handler);
    }
  };

  var off = function(type, handler) {
    if (handler === undefined) {
      this.data[type] = [];
    } else {
      var data = this.data;
      var handlers = data[type];

      if (typeof handlers === "function") {
        data[type] = undefined;
      } else {
        handlers.splice(handlers.indexOf(handler), 1);
      }
    }
  };

  var emit = function(type, data) {
    var handlers = this.data[type];

    if (handlers !== undefined) {
      if (typeof handlers === "function") {
        handlers(data);
      } else {
        for (var i = 0; i < handlers.length; i++) {
          handlers[i](data);
        }
      }
    }
  };

  var component = function (name, options) {
    return function MoonComponent() {
      var this$1 = this;

      this.name = name;

      this.view = options.view.map(function (view) { return view.bind(this$1); });
      this.m = m();

      var data = this.data = options.data();
      var actions = options.actions;
      for (var action in actions) {
        data[action] = actions[action].bind(this$1);
      }

      this.queued = false;
      this.build = build;
      this.set = set;
      this.on = on;
      this.off = off;
      this.emit = emit;
    };
  };

  function Moon(options) {
    var root = options.root;
    if (typeof root === "string") {
      root = document.querySelector(root);
    }

    var view = options.view;
    if (typeof view === "string") {
      options.view = compile(view);
    }

    var data = options.data;
    if (data === undefined) {
      options.data = function () {
        return {};
      };
    } else if (typeof data === "object") {
      options.data = function () { return data; };
    }

    var actions = options.actions;
    if (actions === undefined) {
      options.actions = {};
    }

    var rootComponent = component("m-root", options);
    var instance = new rootComponent();

    instance.view[0](root);
    instance.emit("created");

    return instance;
  }

  Moon.extend = function (name, options) {
    var view = options.view;
    if (typeof view === "string") {
      options.view = compile(view);
    }

    var data = options.data;
    if (data === undefined) {
      options.data = function () {
        return {};
      };
    }

    var actions = options.actions;
    if (actions === undefined) {
      options.actions = {};
    }

    components[name] = component(name, options);
  };

  Moon.compile = compile;
  Moon.config = config;

  return Moon;
}));
