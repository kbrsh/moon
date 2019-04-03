/**
 * Moon v1.0.0-beta.2
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

	function parseElements(start, end, tokens) {
	  const length = end - start;

	  if (length === 0) {
	    return [];
	  } else {
	    for (let elementEnd = start + 1; elementEnd <= end; elementEnd++) {
	      const element = parse(start, elementEnd, tokens);

	      if (element !== null) {
	        const elements = parseElements(elementEnd, end, tokens);

	        if (element !== null) {
	          return [element, ...elements];
	        }
	      }
	    }

	    return null;
	  }
	}

	function parse(start, end, tokens) {
	  const firstToken = tokens[start];
	  const lastToken = tokens[end - 1];
	  const length = end - start;

	  if (length === 0) {
	    return null;
	  } else if (length === 1) {
	    if (firstToken.type === "tagOpen" && firstToken.closed === true) {
	      return {
	        type: firstToken.value,
	        attributes: firstToken.attributes,
	        children: []
	      };
	    } else {
	      return null;
	    }
	  } else {
	    if (firstToken.type === "tagOpen" && lastToken.type === "tagClose" && firstToken.value === lastToken.value) {
	      return {
	        type: firstToken.value,
	        attributes: firstToken.attributes,
	        children: parseElements(start + 1, end - 1, tokens)
	      };
	    } else {
	      return null;
	    }
	  }
	}

	const getElement = element => `m${element}`;
	const setElement = (element, code) => `${getElement(element)}=${code}`;
	const createElement = type => `m.ce("${type}");`;
	const createTextNode = content => `m.ctn(${content});`;
	const createComment = () => `m.cc();`;
	const attributeValue = attribute => attribute.expression ? attribute.value : `"${attribute.value}"`;
	const setAttribute = (element, attribute) => `m.sa(${getElement(element)},"${attribute.key}",${attributeValue(attribute)});`;
	const addEventListener = (element, type, handler) => `m.ael(${getElement(element)},"${type}",${handler});`;
	const setTextContent = (element, content) => `m.stc(${getElement(element)},${content});`;
	const appendChild = (element, parent) => `m.ac(${getElement(element)},${getElement(parent)});`;
	const removeChild = (element, parent) => `m.rc(${getElement(element)},${getElement(parent)});`;
	const insertBefore = (element, reference, parent) => `m.ib(${getElement(element)},${getElement(reference)},${getElement(parent)});`;
	const directiveIf = (ifState, ifConditions, ifPortions, ifParent) => `m.di(${getElement(ifState)},${getElement(ifConditions)},${getElement(ifPortions)},${getElement(ifParent)});`;
	const directiveFor = (forIdentifiers, forLocals, forValue, forPortion, forPortions, forParent) => `m.df(${forIdentifiers},${getElement(forLocals)},${forValue},${getElement(forPortion)},${getElement(forPortions)},${getElement(forParent)});`;

	const isComponentType = type => type[0] === type[0].toUpperCase() && type[0] !== type[0].toLowerCase();

	const generateMount = (element, parent, reference) => reference === null ? appendChild(element, parent) : insertBefore(element, reference, parent);

	const generateAll = (element, parent, root, reference) => {
	  switch (element.type) {
	    case "If":
	      {
	        const ifState = root.nextElement++;
	        const ifReference = root.nextElement++;
	        const ifConditions = root.nextElement++;
	        const ifPortions = root.nextElement++;
	        let ifConditionsCode = "[";
	        let ifPortionsCode = "[";
	        let separator = "";
	        const siblings = parent.children;

	        for (let i = siblings.indexOf(element); i < siblings.length; i++) {
	          const sibling = siblings[i];

	          if (sibling.type === "If" || sibling.type === "ElseIf" || sibling.type === "Else") {
	            ifConditionsCode += separator + (sibling.type === "Else" ? "true" : attributeValue(sibling.attributes[0]));
	            ifPortionsCode += separator + "function(locals){" + generate({
	              element: root.nextElement,
	              nextElement: root.nextElement + 1,
	              type: "Root",
	              attributes: [],
	              children: sibling.children
	            }, ifReference) + "}({})";
	            separator = ",";
	          } else {
	            break;
	          }
	        }

	        return [setElement(ifReference, createComment()) + generateMount(ifReference, parent.element, reference) + setElement(ifPortions, ifPortionsCode + "];"), setElement(ifConditions, ifConditionsCode + "];") + setElement(ifState, directiveIf(ifState, ifConditions, ifPortions, parent.element)), getElement(ifState) + "[2]();"];
	      }

	    case "ElseIf":
	    case "Else":
	      {
	        return ["", "", ""];
	      }

	    case "For":
	      {
	        const forAttribute = attributeValue(element.attributes[0]);
	        let forIdentifiers = "[";
	        let forValue = "";
	        const forReference = root.nextElement++;
	        const forPortion = root.nextElement++;
	        const forPortions = root.nextElement++;
	        const forLocals = root.nextElement++;
	        let forIdentifier = "",
	            separator = "";

	        for (let i = 0; i < forAttribute.length; i++) {
	          const char = forAttribute[i];

	          if (char === "," || char === " " && forAttribute[i + 1] === "i" && forAttribute[i + 2] === "n" && forAttribute[i + 3] === " " && (i += 3)) {
	            forIdentifiers += separator + "\"" + forIdentifier.substring(7) + "\"";
	            forIdentifier = "";
	            separator = ",";
	          } else {
	            forIdentifier += char;
	          }
	        }

	        forIdentifiers += "]";
	        forValue += forIdentifier;
	        return [setElement(forReference, createComment()) + generateMount(forReference, parent.element, reference) + setElement(forPortion, "function(locals){" + generate({
	          element: root.nextElement,
	          nextElement: root.nextElement + 1,
	          type: "Root",
	          attributes: [],
	          children: element.children
	        }, forReference) + "};") + setElement(forPortions, "[];") + setElement(forLocals, "[];"), directiveFor(forIdentifiers, forLocals, forValue, forPortion, forPortions, parent.element), directiveFor(forIdentifiers, forLocals, "[]", forPortion, forPortions, parent.element)];
	      }

	    case "Text":
	      {
	        const textAttribute = element.attributes[0];
	        const textElement = root.nextElement++;
	        const textCode = setTextContent(textElement, attributeValue(textAttribute));
	        let createCode = setElement(textElement, createTextNode("\"\""));
	        let updateCode = "";

	        if (textAttribute.dynamic) {
	          updateCode += textCode;
	        } else {
	          createCode += textCode;
	        }

	        return [createCode + generateMount(textElement, parent.element, reference), updateCode, removeChild(textElement, parent.element)];
	      }

	    default:
	      {
	        const attributes = element.attributes;
	        const children = element.children;

	        if (isComponentType(element.type)) {
	          element.component = root.nextElement++;
	          let createCode = setElement(element.component, `new m.c.${element.type}();`);
	          let updateCode = "";
	          let dynamic = false;

	          for (let i = 0; i < attributes.length; i++) {
	            const attribute = attributes[i];

	            if (attribute.key[0] === "@") {
	              createCode += `${getElement(element.component)}.on("${attribute.key.substring(1)}",function($event){locals.$event=$event;${attributeValue(attribute)};});`;
	            } else {
	              const attributeCode = `${getElement(element.component)}.${attribute.key}=${attributeValue(attribute)};`;

	              if (attribute.dynamic) {
	                dynamic = true;
	                updateCode += attributeCode;
	              } else {
	                createCode += attributeCode;
	              }
	            }
	          }

	          createCode += `${getElement(element.component)}.create(${getElement(parent.element)});`;

	          if (dynamic) {
	            updateCode += `${getElement(element.component)}.update();`;
	          } else {
	            createCode += `${getElement(element.component)}.update();`;
	          }

	          return [createCode, updateCode, `${getElement(element.component)}.destroy();`];
	        } else {
	          element.element = root.nextElement++;
	          let createCode = setElement(element.element, createElement(element.type));
	          let updateCode = "";

	          for (let i = 0; i < attributes.length; i++) {
	            const attribute = attributes[i];
	            let attributeCode;

	            if (attribute.key[0] === "@") {
	              let eventType, eventHandler;

	              if (attribute.key === "@bind") {
	                const bindVariable = attributeValue(attribute);
	                attributeCode = `${getElement(element.element)}.value=${bindVariable};`;
	                eventType = "input";
	                eventHandler = `${bindVariable}=$event.target.value;instance.update();`;
	              } else {
	                attributeCode = "";
	                eventType = attribute.key.substring(1);
	                eventHandler = `locals.$event=$event;${attributeValue(attribute)};`;
	              }

	              createCode += addEventListener(element.element, eventType, `function($event){${eventHandler}}`);
	            } else {
	              attributeCode = setAttribute(element.element, attribute);
	            }

	            if (attribute.dynamic) {
	              updateCode += attributeCode;
	            } else {
	              createCode += attributeCode;
	            }
	          }

	          for (let i = 0; i < children.length; i++) {
	            const childCode = generateAll(children[i], element, root, null);
	            createCode += childCode[0];
	            updateCode += childCode[1];
	          }

	          return [createCode + generateMount(element.element, parent.element, reference), updateCode, removeChild(element.element, parent.element)];
	        }
	      }
	  }
	};
	const generate = (root, reference) => {
	  const children = root.children;
	  let create = "";
	  let update = "";
	  let destroy = "";

	  for (let i = 0; i < children.length; i++) {
	    const generated = generateAll(children[i], root, root, reference);
	    create += generated[0];
	    update += generated[1];
	    destroy += generated[2];
	  }

	  let prelude = `var ${getElement(root.element)}`;

	  for (let i = root.element + 1; i < root.nextElement; i++) {
	    prelude += "," + getElement(i);
	  }

	  return `${prelude};return [function(_0){${setElement(root.element, "_0;")}${create}},function(){${update}},function(){${destroy}}];`;
	};

	const typeRE = /<([\w\d-_]+)([^>]*?)(\/?)>/g;
	const attributeRE = /\s*([\w\d-_]*)(?:=(?:("[\w\d-_]*"|'[\w\d-_]*')|{([\w\d-_]*)}))?/g;
	const whitespaceRE = /\s/;
	function lex(input) {
	  let tokens = [];

	  for (let i = 0; i < input.length;) {
	    const char = input[i];

	    if (char === "<") {
	      const nextChar = input[i + 1];

	      if (nextChar === "/") {
	        const closeIndex = input.indexOf(">", i + 2);
	        const type = input.slice(i + 2, closeIndex);
	        tokens.push({
	          type: "tagClose",
	          value: type
	        });
	        i = closeIndex + 1;
	        continue;
	      } else if (nextChar === "!" && input[i + 2] === "-" && input[i + 3] === "-") {
	        i = input.indexOf("-->", i + 4) + 3;
	        continue;
	      }

	      typeRE.lastIndex = i;
	      let [typeMatch, type, attributesText, closingSlash] = typeRE.exec(input),
	          attributes = {},
	          attributeMatch,
	          attributeKey,
	          attributeValue,
	          attributeExpression;

	      while (([attributeMatch, attributeKey, attributeValue, attributeExpression] = attributeRE.exec(attributesText)) !== null) {
	        if (attributeMatch.length === 0) {
	          attributeRE.lastIndex += 1;
	        } else {
	          attributes[attributeKey] = attributeExpression === undefined ? attributeValue : attributeExpression;
	        }
	      }

	      tokens.push({
	        type: "tagOpen",
	        value: type,
	        attributes,
	        closed: closingSlash === "/"
	      });
	      i += typeMatch.length;
	    } else if (char === "{") {
	      let expression = "";

	      for (; i < input.length; i++) {
	        const char = input[i];

	        if (char === "}") {
	          break;
	        } else {
	          expression += char;
	        }
	      }

	      tokens.push({
	        type: "tagOpen",
	        value: "Text",
	        attributes: {
	          "": expression
	        },
	        closed: true
	      });
	      i += 1;
	    } else if (whitespaceRE.test(char)) {
	      i += 1;
	    } else {
	      let text = "";

	      for (; i < input.length; i++) {
	        const char = input[i];

	        if (char === "<") {
	          break;
	        } else {
	          text += char;
	        }
	      }

	      tokens.push({
	        type: "tagOpen",
	        value: "Text",
	        attributes: {
	          "": `"${text}"`
	        },
	        closed: true
	      });
	    }
	  }

	  return tokens;
	}

	function compile(input) {
	  const tokens = lex(input);
	  return parse(0, tokens.length, tokens);
	}

	const components = {};

	const createElement$1 = type => document.createElement(type);

	const createTextNode$1 = content => document.createTextNode(content);

	const createComment$1 = () => document.createComment("");

	const setAttribute$1 = (element, key, value) => {
	  element.setAttribute(key, value);
	};

	const addEventListener$1 = (element, type, handler) => {
	  element.addEventListener(type, handler);
	};

	const setTextContent$1 = (element, content) => {
	  element.textContent = content;
	};

	const appendChild$1 = (element, parent) => {
	  parent.appendChild(element);
	};

	const removeChild$1 = (element, parent) => {
	  parent.removeChild(element);
	};

	const insertBefore$1 = (element, reference, parent) => {
	  parent.insertBefore(element, reference);
	};

	const directiveIf$1 = (ifState, ifConditions, ifPortions, ifParent) => {
	  for (let i = 0; i < ifConditions.length; i++) {
	    if (ifConditions[i]) {
	      const ifPortion = ifPortions[i];

	      if (ifState === ifPortion) {
	        ifPortion[1]();
	      } else {
	        if (ifState) {
	          ifState[2]();
	        }

	        ifPortion[0](ifParent);
	        ifPortion[1]();
	        ifState = ifPortion;
	      }

	      return ifState;
	    }
	  }
	};

	const directiveFor$1 = (forIdentifiers, forLocals, forValue, forPortion, forPortions, forParent) => {
	  const previousLength = forPortions.length;
	  const nextLength = forValue.length;
	  const maxLength = previousLength > nextLength ? previousLength : nextLength;
	  const keyIdentifier = forIdentifiers[1];
	  const valueIdentifier = forIdentifiers[0];

	  for (let i = 0; i < maxLength; i++) {
	    if (i >= previousLength) {
	      const forLocal = {};
	      forLocal[keyIdentifier] = i;
	      forLocal[valueIdentifier] = forValue[i];
	      forLocals[i] = forLocal;
	      const newForPortion = forPortion(forLocal);
	      forPortions.push(newForPortion);
	      newForPortion[0](forParent);
	      newForPortion[1]();
	    } else if (i >= nextLength) {
	      forPortions.pop()[2]();
	    } else {
	      const forLocal = forLocals[i];
	      forLocal[keyIdentifier] = i;
	      forLocal[valueIdentifier] = forValue[i];
	      forPortions[i][1]();
	    }
	  }
	};

	const m = {
	  c: components,
	  ce: createElement$1,
	  ctn: createTextNode$1,
	  cc: createComment$1,
	  sa: setAttribute$1,
	  ael: addEventListener$1,
	  stc: setTextContent$1,
	  ac: appendChild$1,
	  rc: removeChild$1,
	  ib: insertBefore$1,
	  di: directiveIf$1,
	  df: directiveFor$1
	};

	const create = function (root) {
	  this._view[0](root);

	  this.emit("create");
	};

	const update = function (key, value) {
	  if (key !== undefined) {
	    if (typeof key === "object") {
	      for (let childKey in key) {
	        this[childKey] = key[childKey];
	      }
	    } else {
	      this[key] = value;
	    }
	  }

	  if (this._queued === false) {
	    this._queued = true;
	    const instance = this;
	    setTimeout(() => {
	      instance._view[1]();

	      instance._queued = false;
	      instance.emit("update");
	    }, 0);
	  }
	};

	const destroy = function () {
	  this._view[2]();

	  this.emit("destroy");
	};

	const on = function (type, handler) {
	  let events = this._events;
	  let handlers = events[type];

	  if (handlers === undefined) {
	    events[type] = [handler.bind(this)];
	  } else {
	    handlers.push(handler.bind(this));
	  }
	};

	const off = function (type, handler) {
	  if (type === undefined) {
	    this._events = {};
	  } else if (handler === undefined) {
	    this._events[type] = [];
	  } else {
	    let handlers = this._events[type];
	    handlers.splice(handlers.indexOf(handler), 1);
	  }
	};

	const emit = function (type, data) {
	  let handlers = this._events[type];

	  if (handlers !== undefined) {
	    for (let i = 0; i < handlers.length; i++) {
	      handlers[i](data);
	    }
	  }
	};

	const component = (name, data) => {
	  // View
	  let view = data.view;

	  if (typeof view === "string") {
	    view = new Function("m", "instance", "locals", compile(view));
	  }

	  delete data.view; // Events

	  let onCreate = data.onCreate;
	  let onUpdate = data.onUpdate;
	  let onDestroy = data.onDestroy;
	  delete data.onCreate;
	  delete data.onUpdate;
	  delete data.onDestroy; // Constructor

	  function MoonComponent() {
	    this._view = view(m, this, {});
	    this._events = {};

	    if (onCreate !== undefined) {
	      this.on("create", onCreate);
	    }

	    if (onUpdate !== undefined) {
	      this.on("update", onUpdate);
	    }

	    if (onDestroy !== undefined) {
	      this.on("destroy", onDestroy);
	    }
	  } // Initialize


	  MoonComponent.prototype = data; // Properties

	  data._name = name;
	  data._queued = false; // Methods

	  data.create = create;
	  data.update = update;
	  data.destroy = destroy;
	  data.on = on;
	  data.off = off;
	  data.emit = emit;
	  return MoonComponent;
	};

	const config = {
	  silent: "development" === "production" || typeof console === "undefined"
	};

	function Moon(data) {
	  let root = data.root;
	  delete data.root;

	  if (typeof root === "string") {
	    root = document.querySelector(root);
	  }

	  const instanceComponent = component("", data);
	  const instance = new instanceComponent();
	  instance.create(root);
	  instance.update();
	  return instance;
	}

	Moon.extend = (name, data) => {
	  components[name] = component(name, data);
	};

	Moon.parse = parse;
	Moon.generate = generate;
	Moon.compile = compile;
	Moon.config = config;

	return Moon;
}));
