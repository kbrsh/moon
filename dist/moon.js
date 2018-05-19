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
  var locals = ["NaN", "event", "false", "in", "m", "null", "this", "true", "typeof", "undefined"];

  var parseTemplate = function (expression, dependencies) {
    var info, dynamic = false;

    while ((info = expressionRE.exec(expression)) !== null) {
      var name = info[1];
      if (name !== undefined && locals.indexOf(name) === -1 && name[0] !== "$") {
        dynamic = true;

        if (dependencies.indexOf(name) === -1) {
          dependencies.push(name);
        }
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

  var whitespaceRE = /\s+/;

  var pushChild = function (child, stack) {
    stack[stack.length - 1].children.push(child);
  };

  var parseAttributes = function (index, input, length, attributes, directives, dependencies) {
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

        (key[0] === "m" && key[1] === "-" ? directives : attributes).push({
          key: key,
          value: value,
          argument: argument,
          expression: expression,
          dynamic: expression && parseTemplate(value, dependencies)
        });
      }
    }

    return index;
  };

  var parseOpeningTag = function (index, input, length, stack, dependencies) {
    var type = "";
    var attributes = [];
    var directives = [];

    while (index < length) {
      var char = input[index];

      if (char === ">") {
        var element = {
          index: stack[0].nextIndex++,
          type: type,
          attributes: attributes,
          directives: directives,
          children: []
        };

        pushChild(element, stack);
        stack.push(element);

        index += 1;
        break;
      } else if (char === "/" && input[index + 1] === ">") {
        pushChild({
          index: stack[0].nextIndex++,
          type: type,
          attributes: attributes,
          directives: directives,
          children: []
        }, stack);

        index += 2;
        break;
      } else if (whitespaceRE.test(char)) {
        attributes = [];
        directives = [];
        index = parseAttributes(index + 1, input, length, attributes, directives, dependencies);
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

    if (!whitespaceRE.test(content)) {
      pushChild({
        index: stack[0].nextIndex++,
        type: "m-text",
        content: content.replace(escapeRE, function (match) { return escapeMap[match]; })
      }, stack);
    }

    return index;
  };

  var parseExpression = function (index, input, length, stack, dependencies) {
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
      index: stack[0].nextIndex++,
      type: "m-expression",
      content: expression,
      dynamic: parseTemplate(expression, dependencies)
    }, stack);

    return index;
  };

  var parse = function (input) {
    var length = input.length;
    var dependencies = [];

    var root = {
      index: 0,
      nextIndex: 1,
      type: "m-root",
      attributes: [],
      directives: [],
      children: [],
      dependencies: dependencies
    };

    var stack = [root];

    for (var i = 0; i < length;) {
      var char = input[i];

      if (char === "<") {
        if (input[i + 1] === "!" && input[i + 2] === "-" && input[i + 3] === "-") {
          i = parseComment(i + 4, input, length);
        } else if (input[i + 1] === "/") {
          i = parseClosingTag(i + 2, input, length, stack);
        } else {
          i = parseOpeningTag(i + 1, input, length, stack, dependencies);
        }
      } else if (char === "{") {
        i = parseExpression(i + 1, input, length, stack, dependencies);
      } else {
        i = parseText(i, input, length, stack);
      }
    }

    return root;
  };

  var mapReduce = function (arr, fn) { return arr.reduce(function (result, current) { return result + fn(current); }, ""); };

  var assignElement = function (element, code) { return ("m[" + element + "]=" + code); };

  var attributeValue = function (attribute) { return attribute.expression ? attribute.value : ("\"" + (attribute.value) + "\""); };

  var createElement = function (type) { return ("m.ce(\"" + type + "\");"); };

  var createTextNode = function (content) { return ("m.ctn(" + content + ");"); };

  var appendChild = function (element, parent) { return ("m.ac(m[" + element + "],m[" + parent + "]);"); };

  var removeChild = function (element, parent) { return ("m.rc(m[" + element + "],m[" + parent + "]);"); };

  var addEventListener = function (element, type, handler) { return ("m.ael(m[" + element + "],\"" + type + "\"," + handler + ");"); };

  var setAttribute = function (element, attribute) { return ("m.sa(m[" + element + "],\"" + (attribute.key) + "\"," + (attributeValue(attribute)) + ");"); };

  var setTextContent = function (element, content) { return ("m.stc(m[" + element + "]," + content + ");"); };

  var directives = {
    "m-on": {
      create: function (code, directive, element, parent, root) {
        directive.on = root.nextIndex++;
        return code + addEventListener(element.index, directive.argument, ("function($event){m[" + (directive.on) + "]($event);}"));
      },
      mount: function (code) { return code; },
      update: function (code, directive) { return code + assignElement(directive.on, ("function($event){" + (attributeValue(directive)) + ";};")); }
    }
  };

  var generateCreate = function (element, parent, root) {
    switch (element.type) {
      case "m-expression":
        return assignElement(element.index, createTextNode("\"\""));
        break;
      case "m-text":
        return assignElement(element.index, createTextNode(("\"" + (element.content) + "\"")));
        break;
      default:
        var elementDirectives = element.directives;
        var code = assignElement(element.index, createElement(element.type) + mapReduce(element.attributes, function (attribute) { return attribute.dynamic ? "" : setAttribute(element.index, attribute); }) + mapReduce(element.children, function (child) { return generateCreate(child, element, root); }));

        for (var i = 0; i < elementDirectives.length; i++) {
          var elementDirective = elementDirectives[i];
          code = directives[elementDirective.key].create(code, elementDirective, element, parent, root);
        }

        return code;
    }
  };

  var generateMount = function (element, parent, root) {
    switch (element.type) {
      case "m-expression":
      case "m-text":
        return appendChild(element.index, parent.index);
        break;
      default:
        var elementDirectives = element.directives;
        var code = appendChild(element.index, parent.index) + mapReduce(element.children, function (child) { return generateMount(child, element, root); });
        
        for (var i = 0; i < elementDirectives.length; i++) {
          var elementDirective = elementDirectives[i];
          code = directives[elementDirective.key].mount(code, elementDirective, element, parent, root);
        }

        return code;
    }
  };

  var generateUpdate = function (element, parent, root) {
    switch (element.type) {
      case "m-expression":
        return element.dynamic ? setTextContent(element.index, element.content) : "";
        break;
      case "m-text":
        return "";
        break;
      default:
        var elementDirectives = element.directives;
        var code = mapReduce(element.attributes, function (attribute) { return attribute.dynamic ? setAttribute(element.index, attribute) : ""; }) + mapReduce(element.children, function (child) { return generateUpdate(child, element, root); });

        for (var i = 0; i < elementDirectives.length; i++) {
          var elementDirective = elementDirectives[i];
          code = directives[elementDirective.key].update(code, elementDirective, element, parent, root);
        }

        return code;
    }
  };

  var generate = function (tree) {
    return new Function(("return [function(m){this.m[0]=m;m=this.m;" + (mapReduce(tree.children, function (child) { return generateCreate(child, tree, tree); })) + (mapReduce(tree.children, function (child) { return generateMount(child, tree, tree); })) + "},function(){var m=this.m;" + (mapReduce(tree.dependencies, function (dependency) { return ("var " + dependency + "=this.data." + dependency + ";"); })) + (mapReduce(tree.children, function (child) { return generateUpdate(child, tree, tree); })) + "},function(){var m=this.m;" + (mapReduce(tree.children, function (child) { return removeChild(child.index, tree.index); })) + "m=[m[0]];}];"))();
  };

  var compile = function (input) {
    return generate(parse(input));
  };

  var components = {};

  var createElement$1 = function (type) { return document.createElement(type); };

  var createTextNode$1 = function (content) { return document.createTextNode(content); };

  var appendChild$1 = function (element, parent) {
    parent.appendChild(element);
  };

  var removeChild$1 = function (element, parent) {
    parent.removeChild(element);
  };

  var addEventListener$1 = function (element, type, handler) {
    element.addEventListener(type, handler);
  };

  var setAttribute$1 = function (element, key, value) {
    element.setAttribute(key, value);
  };

  var setTextContent$1 = function (element, content) {
    element.textContent = content;
  };

  var m = function () {
    var m = [];
    m.c = components;
    m.ce = createElement$1;
    m.ctn = createTextNode$1;
    m.ac = appendChild$1;
    m.rc = removeChild$1;
    m.ael = addEventListener$1;
    m.sa = setAttribute$1;
    m.stc = setTextContent$1;
    return m;
  };

  var create = function(root) {
    this.view[0](root);
    this.emit("created");
  };

  var update = function() {
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

  var destroy = function() {
    this.view[2]();
    this.emit("destroyed");
  };

  var set = function(key, value) {
    var this$1 = this;

    if (typeof key === "object") {
      for (var childKey in key) {
        this$1.set(childKey, key[childKey]);
      }
    } else {
      this.data[key] = value;
      this.update();
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
      this.create = create;
      this.update = update;
      this.destroy = destroy;
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

    var instanceComponent = component("m-instance", options);
    var instance = new instanceComponent();

    instance.create(root);
    instance.update();

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
