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

  var expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)/g;
  var locals = ["NaN", "event", "false", "in", "m", "null", "this", "true", "typeof", "undefined"];

  var parseTemplate = function (expression, dependencies) {
    var dynamic = false;

    expression = expression.replace(expressionRE, function(match, name) {
      if (name === undefined || locals.indexOf(name) !== -1 || name[0] === "$") {
        return match;
      } else {
        dynamic = true;

        if (dependencies.indexOf(name) === -1) {
          dependencies.push(name);
        }

        return ("data." + name);
      }
    });

    return {
      expression: expression,
      dynamic: dynamic
    };
  };

  var config = {
    silent: ("development" === "production") || (typeof console === "undefined")
  };

  var error = function (message) {
    if (config.silent === false) {
      console.error("[Moon] ERROR: " + message);
    }
  };

  var whitespaceRE = /^\s+$/;

  var parseAttributes = function (index, input, length, dependencies, attributes) {
    while (index < length) {
      var char = input[index];

      if (char === "/" || char === ">") {
        break;
      } else if (whitespaceRE.test(char)) {
        index += 1;
        continue;
      } else {
        var key = "";
        var value = "";
        var expression = false;

        while (index < length) {
          char = input[index];

          if (char === "/" || char === ">" || whitespaceRE.test(char)) {
            value = "";
            break;
          } else if (char === "=") {
            index += 1;
            break;
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

        var template = parseTemplate(value, dependencies);
        attributes.push({
          key: key,
          value: template.expression,
          expression: expression,
          dynamic: expression && template.dynamic
        });
      }
    }

    return index;
  };

  var parseOpeningTag = function (index, input, length, stack, dependencies) {
    var element = {
      type: "",
      attributes: [],
      children: []
    };

    while (index < length) {
      var char = input[index];

      if (char === ">") {
        var attributes = element.attributes;

        if (element.type[0] !== "#") {
          element.index = stack[0].nextIndex++;
        }

        stack.push(element);

        for (var i = 0; i < attributes.length;) {
          var attribute = attributes[i];

          if (attribute.key[0] === "#") {
            element = {
              type: attribute.key,
              attributes: [{
                key: "",
                value: attribute.value,
                expression: attribute.expression,
                dynamic: attribute.dynamic
              }],
              children: [element]
            };
            attributes.splice(i, 1);
          } else {
            i += 1;
          }
        }

        stack[stack.length - 2].children.push(element);

        index += 1;
        break;
      } else if (char === "/" && input[index + 1] === ">") {
        if (element.type[0] !== "#") {
          element.index = stack[0].nextIndex++;
        }

        stack[stack.length - 1].children.push(element);

        index += 2;
        break;
      } else if ((whitespaceRE.test(char) && (index += 1)) || char === "=") {
        index = parseAttributes(index, input, length, dependencies, element.attributes);
      } else {
        element.type += char;
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
      stack[stack.length - 1].children.push({
        type: "#text",
        attributes: [{
          key: "",
          value: content.replace(escapeRE, function (match) { return escapeMap[match]; }),
          expression: false,
          dynamic: false
        }],
        children: []
      });
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

    var template = parseTemplate(expression, dependencies);
    stack[stack.length - 1].children.push({
      type: "#text",
      attributes: [{
        key: "",
        value: template.expression,
        expression: true,
        dynamic: template.dynamic
      }],
      children: []
    });

    return index;
  };

  var parse = function (input) {
    var length = input.length;
    var dependencies = [];

    var root = {
      index: 0,
      nextIndex: 1,
      type: "#root",
      attributes: [],
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

  var mapReduce = function (arr, fn) {
    var result = "";

    for (var i = 0; i < arr.length; i++) {
      result += fn(arr[i]);
    }

    return result;
  };

  var getElement = function (element) { return ("m[" + element + "]"); };

  var setElement = function (element, code) { return ((getElement(element)) + "=" + code); };

  var createElement = function (type) { return ("m.ce(\"" + type + "\");"); };

  var createTextNode = function (content) { return ("m.ctn(" + content + ");"); };

  var createComment = function () { return "m.cc();"; };

  var attributeValue = function (attribute) { return attribute.expression ? attribute.value : ("\"" + (attribute.value) + "\""); };

  var setAttribute = function (element, attribute) { return ("m.sa(" + (getElement(element)) + ",\"" + (attribute.key) + "\"," + (attributeValue(attribute)) + ");"); };

  var addEventListener = function (element, attribute) { return ("m.ael(" + (getElement(element)) + ",\"" + (attribute.key.substring(1)) + "\",function($event){" + (attributeValue(attribute)) + "});"); };

  var setTextContent = function (element, content) { return ("m.stc(" + (getElement(element)) + "," + content + ");"); };

  var appendChild = function (element, parent) { return ("m.ac(" + (getElement(element)) + "," + (getElement(parent)) + ");"); };

  var removeChild = function (element, parent) { return ("m.rc(" + (getElement(element)) + "," + (getElement(parent)) + ");"); };

  var insertBefore = function (element, reference, parent) { return ("m.ib(" + (getElement(element)) + "," + (getElement(reference)) + "," + (getElement(parent)) + ");"); };

  var generateDestroy = function (element, parent, root) {
    switch (element.type) {
      case "#if": {
        return removeChild(element.ifReference, parent.index) + "if(" + (getElement(element.ifState)) + "===1){" + (getElement(element.elseDestroy)) + "();}";
      }
      case "#else": {
        return ("else{" + (getElement(element.ifDestroy)) + "();}");
      }
      case "#comment": {
        return removeChild(element.commentElement, parent.index);
      }
      case "#text": {
        return removeChild(element.textElement, parent.index);
      }
      default: {
        return removeChild(element.index, parent.index);
      }
    }
  };

  var generateMount = function (element, parent, insert) { return insert === undefined ? appendChild(element, parent) : insertBefore(element, insert, parent); };

  var generateCreate = function (element, parent, root, insert) {
    switch (element.type) {
      case "#if": {
        var siblings = parent.children;
        var nextSiblingIndex = siblings.indexOf(element) + 1;
        var nextSibling = siblings[nextSiblingIndex];

        element.ifReference = root.nextIndex++;
        element.ifState = root.nextIndex++;
        element.ifCreate = root.nextIndex++;
        element.elseDestroy = root.nextIndex++;

        if (nextSibling !== undefined && nextSibling.type === "#else") {
          nextSibling.ifState = element.ifState;
          nextSibling.elseCreate = root.nextIndex++;
          nextSibling.ifDestroy = root.nextIndex++;
        } else {
          nextSibling = {
            type: "#else",
            attributes: [],
            children: [],
            ifState: element.ifState,
            elseCreate: root.nextIndex++,
            ifDestroy: root.nextIndex++
          };

          siblings.splice(nextSiblingIndex, 0, nextSibling);
        }

        var ifCreate = "";
        var ifDestroy = "";
        var elseCreate = "";
        var elseDestroy = "";

        var elementChildren = element.children;
        for (var i = 0; i < elementChildren.length; i++) {
          var child = elementChildren[i];
          ifCreate += generateCreate(child, parent, root, element.ifReference);
          ifDestroy += generateDestroy(child, parent, root);
        }

        var nextSiblingChildren = nextSibling.children;
        for (var i$1 = 0; i$1 < nextSiblingChildren.length; i$1++) {
          var child$1 = nextSiblingChildren[i$1];
          elseCreate += generateCreate(child$1, parent, root, element.ifReference);
          elseDestroy += generateDestroy(child$1, parent, root);
        }

        return setElement(element.ifReference, createComment()) + generateMount(element.ifReference, parent.index, insert) + setElement(element.ifCreate, ("function(){" + ifCreate + "};")) + setElement(nextSibling.ifDestroy, ("function(){" + ifDestroy + "};")) + setElement(nextSibling.elseCreate, ("function(){" + elseCreate + "};")) + setElement(element.elseDestroy, ("function(){" + elseDestroy + "};")) + "if(" + (attributeValue(element.attributes[0])) + "){" + (getElement(element.ifCreate)) + "();" + (setElement(element.ifState, "0;")) + "}";
      }
      case "#else": {
        return ("else{" + (getElement(element.elseCreate)) + "();" + (setElement(element.ifState, "1;")) + "}");
      }
      case "#comment": {
        element.commentElement = root.nextIndex++;
        return setElement(element.commentElement, createComment()) + generateMount(element.commentElement, parent.index, insert);
      }
      case "#text": {
        var textAttribute = element.attributes[0];
        element.textElement = root.nextIndex++;
        return setElement(element.textElement, createTextNode(attributeValue(textAttribute))) + generateMount(element.textElement, parent.index, insert);
      }
      default: {
        return setElement(element.index, createElement(element.type)) + mapReduce(element.attributes, function (attribute) {
          if (attribute.key[0] === "@") {
            return addEventListener(element.index, attribute);
          } else {
            return setAttribute(element.index, attribute);
          }
        }) + mapReduce(element.children, function (child) { return generateCreate(child, element, root); }) + generateMount(element.index, parent.index, insert);
      }
    }
  };

  var generateUpdate = function (element, parent, root) {
    switch (element.type) {
      case "#if": {
        return ("if(" + (attributeValue(element.attributes[0])) + "){if(" + (getElement(element.ifState)) + "===0){" + (mapReduce(element.children, function (child) { return generateUpdate(child, parent, root); })) + "}else{" + (getElement(element.elseDestroy)) + "();" + (getElement(element.ifCreate)) + "();" + (setElement(element.ifState, "0;")) + "}}");
      }
      case "#else": {
        return ("else{if(" + (getElement(element.ifState)) + "===1){" + (mapReduce(element.children, function (child) { return generateUpdate(child, parent, root); })) + "}else{" + (getElement(element.ifDestroy)) + "();" + (getElement(element.elseCreate)) + "();" + (setElement(element.ifState, "1;")) + "}}");
      }
      case "#text": {
        var textAttribute = element.attributes[0];
        return textAttribute.dynamic ? setTextContent(element.textElement, textAttribute.value) : "";
      }
      default: {
        return mapReduce(element.attributes, function (attribute) {
          if (attribute.key[0] === "@" || !attribute.dynamic) {
            return "";
          } else {
            return setAttribute(element.index, attribute);
          }
        }) + mapReduce(element.children, function (child) { return generateUpdate(child, element, root); });
      }
    }
  };

  var generate = function (tree) {
    return new Function(("return [function(m){this.m[0]=m;m=this.m;var data=this.data;" + (mapReduce(tree.children, function (child) { return generateCreate(child, tree, tree); })) + "},function(){var m=this.m;var data=this.data;" + (mapReduce(tree.children, function (child) { return generateUpdate(child, tree, tree); })) + "},function(){var m=this.m;" + (mapReduce(tree.children, function (child) { return generateDestroy(child, tree, tree); })) + "this.m=[m[0]];}];"))();
  };

  var compile = function (input) {
    return generate(parse(input));
  };

  var components = {};

  var createElement$1 = function (type) { return document.createElement(type); };

  var createTextNode$1 = function (content) { return document.createTextNode(content); };

  var createComment$1 = function () { return document.createComment(""); };

  var setAttribute$1 = function (element, key, value) {
    element.setAttribute(key, value);
  };

  var addEventListener$1 = function (element, type, handler) {
    element.addEventListener(type, handler);
  };

  var setTextContent$1 = function (element, content) {
    element.textContent = content;
  };

  var appendChild$1 = function (element, parent) {
    parent.appendChild(element);
  };

  var removeChild$1 = function (element, parent) {
    parent.removeChild(element);
  };

  var insertBefore$1 = function (element, reference, parent) {
    parent.insertBefore(element, reference);
  };

  var m = function () {
    var m = [];
    m.c = components;
    m.ce = createElement$1;
    m.ctn = createTextNode$1;
    m.cc = createComment$1;
    m.sa = setAttribute$1;
    m.ael = addEventListener$1;
    m.stc = setTextContent$1;
    m.ac = appendChild$1;
    m.rc = removeChild$1;
    m.ib = insertBefore$1;
    return m;
  };

  var create = function(root) {
    this.view[0](root);
    this.emit("create");
  };

  var update = function(key, value) {
    var this$1 = this;

    if (key !== undefined) {
      if (typeof key === "object") {
        for (var childKey in key) {
          this$1.data[childKey] = key[childKey];
        }
      } else {
        this.data[key] = value;
      }
    }

    if (this.queued === false) {
      this.queued = true;

      var instance = this;
      setTimeout(function () {
        instance.view[1]();
        instance.queued = false;
        instance.emit("update");
      }, 0);
    }
  };

  var destroy = function() {
    this.view[2]();
    this.emit("destroy");
  };

  var on = function(type, handler) {
    var events = this.events;
    var handlers = events[type];

    if (handlers === undefined) {
      events[type] = handler;
    } else if (typeof handlers === "function") {
      events[type] = [handlers, handler];
    } else {
      handlers.push(handler);
    }
  };

  var off = function(type, handler) {
    if (type === undefined) {
      this.events = {};
    } else if (handler === undefined) {
      this.events[type] = [];
    } else {
      var events = this.events;
      var handlers = events[type];

      if (typeof handlers === "function") {
        events[type] = undefined;
      } else {
        handlers.splice(handlers.indexOf(handler), 1);
      }
    }
  };

  var emit = function(type, data) {
    var handlers = this.events[type];

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
      this.queued = false;

      this.view = options.view.map(function (view) { return view.bind(this$1); });
      this.m = m();

      var data = this.data = options.data();
      for (var key in data) {
        var value = data[key];
        if (typeof value === "function") {
          data[key] = value.bind(this$1);
        }
      }

      var events = this.events = options.events;
      for (var type in events) {
        var handlers = events[type];
        if (typeof handlers === "function") {
          events[type] = handlers.bind(this$1);
        } else {
          for (var i = 0; i < handlers.length; i++) {
            handlers[i] = handlers[i].bind(this$1);
          }
        }
      }

      this.create = create;
      this.update = update;
      this.destroy = destroy;
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

    var events = options.events;
    if (events === undefined) {
      options.events = {};
    }

    var instanceComponent = component("", options);
    var instance = new instanceComponent();

    instance.create(root);

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

    var events = options.events;
    if (events === undefined) {
      options.events = {};
    }

    components[name] = component(name, options);
  };

  Moon.compile = compile;
  Moon.config = config;

  return Moon;
}));
