/**
 * Moon v0.11.0
 * Copyright 2016-2018 Kabir Shah
 * Released under the MIT License
 * http://moonjs.ga
 */

const log = function(msg) {
  if(Moon$1.config.silent === false) {
    console.log(msg);
  }
};

const error = function(msg) {
  if(Moon$1.config.silent === false) {
    console.error("[Moon] ERROR: " + msg);
  }
};

const queueBuild = function(instance) {
  if(instance.queued === false) {
    instance.queued = true;
    setTimeout(function() {
      instance.build();
      instance.queued = false;
      callHook(instance, "updated");
    }, 0);
  }
};

const callHook = function(instance, name) {
  const hook = instance.hooks[name];
  if(hook !== undefined) {
    hook.call(instance);
  }
};

const defineProperty = function(obj, prop, value, def) {
  if(value === undefined) {
    obj[prop] = def;
  } else {
    obj[prop] = value;
  }
};

const noop = function() {
  
};

// Concatenation Symbol
const concatenationSymbol = " + ";

// Opening delimiter
const openRE = /\{\{\s*/;

// Closing delimiter
const closeRE = /\s*\}\}/;

// Whitespace character
const whitespaceCharRE = /[\s\n]/;

// All whitespace
const whitespaceRE = /[\s\n]/g;

// Start of a tag or comment
const tagOrCommentStartRE = /<\/?(?:[A-Za-z]+\w*)|<!--/;

// Dynamic expressions
const expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)(?:\s*\()?/g;

// HTML Escapes
const escapeRE = /(?:(?:&(?:amp|gt|lt|nbsp|quot);)|"|\\|\n)/g;
const escapeMap = {
  "&amp;": '&',
  "&gt;": '>',
  "&lt;": '<',
  "&nbsp;": ' ',
  "&quot;": "\\\"",
  '\\': "\\\\",
  '"': "\\\"",
  '\n': "\\n"
};

// Global Variables/Keywords
const globals = ["NaN", "false", "in", "instance", 'm', "null", "staticNodes", "true", "typeof", "undefined"];

// Void and SVG Elements
const VOID_ELEMENTS = ["area", "base", "br", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
const SVG_ELEMENTS = ["animate", "circle", "clippath", "cursor", "defs", "desc", "ellipse", "filter", "font-face", "foreignObject", "g", "glyph", "image", "line", "marker", "mask", "missing-glyph", "path", "pattern", "polygon", "polyline", "rect", "svg", "switch", "symbol", "text", "textpath", "tspan", "use", "view"];

// Data Flags
const FLAG_STATIC = 1;
const FLAG_SVG = 1 << 1;

// Trim Whitespace
const trimWhitespace = function(value) {
  return value.replace(whitespaceRE, '');
};

const compileTemplateExpression = function(expression, state) {
  const dependencies = state.dependencies;
  let props = dependencies.props;
  let methods = dependencies.methods;

  const exclude = state.exclude;
  const locals = state.locals;

  let dynamic = false;
  let info;

  while((info = expressionRE.exec(expression)) !== null) {
    let match = info[0];
    let name = info[1];
    if(name !== undefined && exclude.indexOf(name) === -1) {
      if(match[match.length - 1] === "(") {
        if(methods.indexOf(name) === -1) {
          methods.push(name);
        }
      } else {
        if(locals.indexOf(name) === -1 && props.indexOf(name) === -1) {
          props.push(name);
        }

        dynamic = true;
      }
    }
  }

  return dynamic;
};

const compileTemplate = function(template, state) {
  const length = template.length;
  let current = 0;
  let dynamic = false;
  let output = '';

  if(length === 0) {
    output = "\"\"";
  } else {
    while(current < length) {
      // Match text
      const textTail = template.substring(current);
      const textMatch = textTail.match(openRE);

      if(textMatch === null) {
        // Only static text
        output += `"${textTail}"`;
        break;
      }

      const textIndex = textMatch.index;
      if(textIndex !== 0) {
        // Add static text and move to template expression
        output += `"${textTail.substring(0, textIndex)}"`;
        current += textIndex;
      }

      // Mark as dynamic
      dynamic = true;

      // Concatenate if not at the start
      if(current !== 0) {
        output += concatenationSymbol;
      }

      // Exit opening delimiter
      current += textMatch[0].length;

      // Get expression, and exit closing delimiter
      const expressionTail = template.substring(current);
      const expressionMatch = expressionTail.match(closeRE);

      if("production" !== "production" && expressionMatch === null) {
        error(`Expected closing delimiter after "${expressionTail}"`);
      } else {
        // Add expression
        const expressionIndex = expressionMatch.index;
        const expression = expressionTail.substring(0, expressionIndex);
        compileTemplateExpression(expression, state);
        output += `(${expression})`;
        current += expression.length + expressionMatch[0].length;

        // Concatenate if not at the end
        if(current !== length) {
          output += concatenationSymbol;
        }
      }
    }
  }

  return {
    output: output,
    dynamic: dynamic
  };
};

const generateStaticNode = function(nodeOutput, staticNodes) {
  const staticNodesLength = staticNodes.length;
  staticNodes[staticNodesLength] = nodeOutput;
  return `staticNodes[${staticNodesLength}]`;
};

const generateData = function(data) {
  let dataOutput = '{';
  let separator = '';

  // Events
  let events = data.events;
  let eventHandlerSeparator = '';
  if(events !== undefined) {
    dataOutput += "events: {";

    for(let eventType in events) {
      dataOutput += `${separator}"${eventType}": [`;

      let handlers = events[eventType];
      for(let i = 0; i < handlers.length; i++) {
        dataOutput += eventHandlerSeparator + handlers[i];
        eventHandlerSeparator = ", ";
      }

      separator = ", ";
      eventHandlerSeparator = '';
      dataOutput += ']';
    }

    dataOutput += '}';
    delete data.events;
  }

  // Flags
  if(data.flags === 0) {
    delete data.flags;
  }

  for(let key in data) {
    dataOutput += `${separator}${key}: ${data[key]}`;
    separator = ", ";
  }

  return dataOutput + '}';
};

const generateProps = function(type, props) {
  let propOutput = type + ": {";
  let separator = '';

  for(let i = 0; i < props.length; i++) {
    const prop = props[i];
    let propValue = prop.value;

    if(propValue.length === 0) {
      propValue = "\"\"";
    }

    propOutput += `${separator}"${prop.name}": ${propValue}`;
    separator = ", ";
  }

  return propOutput + '}';
};

const generateNodeState = function(node, parentNode, state) {
  const type = node.type;
  if(type === "#text") {
    // Text
    const compiledText = compileTemplate(node.value, state);
    node.value = compiledText.output;
    return compiledText.dynamic;
  } else if(type === "m-insert") {
    // Insert
    parentNode.deep = true;
    return true;
  } else {
    const locals = state.locals;
    let dynamic = false;
    let data = node.data;

    // SVG flag
    if(SVG_ELEMENTS.indexOf(type) !== -1) {
      data.flags = data.flags | FLAG_SVG;
    }

    // Props
    const props = node.props;
    const propsLength = props.length;
    let propStateAttrs = [];
    let propStateDirectives = [];
    let propStateSpecialDirectivesAfter = [];
    node.props = {
      attrs: propStateAttrs,
      dom: [],
      directives: propStateDirectives,
      specialDirectivesAfter: propStateSpecialDirectivesAfter
    };

    // Before/After special directives
    for(let i = 0; i < propsLength; i++) {
      const prop = props[i];
      const specialDirective = specialDirectives[prop.name];

      if(specialDirective !== undefined) {
        const specialDirectiveAfter = specialDirective.after;
        if(specialDirectiveAfter !== undefined) {
          propStateSpecialDirectivesAfter.push({
            prop: prop,
            after: specialDirectiveAfter
          });
        }

        const specialDirectiveBefore = specialDirective.before;
        if(specialDirectiveBefore !== undefined) {
          if(specialDirectiveBefore(prop, node, parentNode, state) === true) {
            dynamic = true;
          }
        }
      }
    }

    // Attributes
    for(let i = 0; i < propsLength; i++) {
      const prop = props[i];
      const propName = prop.name;
      const specialDirective = specialDirectives[propName];

      if(specialDirective !== undefined) {
        // During special directive
        const specialDirectiveDuring = specialDirective.during;
        if(specialDirectiveDuring !== undefined) {
          if(specialDirectiveDuring(prop, node, parentNode, state) === true) {
            dynamic = true;
          }

          propStateAttrs.push(prop);
        }
      } else if(propName[0] === 'm' && propName[1] === '-') {
        // Directive
        if(compileTemplateExpression(prop.value, state) === true) {
          dynamic = true;
        }

        propStateDirectives.push(prop);
      } else {
        // Attribute
        const compiledProp = compileTemplate(prop.value, state);

        if(compiledProp.dynamic === true) {
          dynamic = true;
        }

        prop.value = compiledProp.output;
        propStateAttrs.push(prop);
      }
    }

    // Children
    const children = node.children;
    let childStates = [];

    for(let i = 0; i < children.length; i++) {
      const childState = generateNodeState(children[i], node, state);

      if(childState === true) {
        dynamic = true;
      }

      childStates.push(childState);
    }

    for(let i = 0; i < children.length; i++) {
      if(dynamic === true && childStates[i] === false) {
        const childData = children[i].data;
        childData.flags = childData.flags | FLAG_STATIC;
      }
    }

    // Restore locals
    state.locals = locals;

    return dynamic;
  }
};

const generateNode = function(node, parentNode, state) {
  const type = node.type;
  let data = node.data;
  let callOutput;

  if(type === "#text") {
    // Text
    callOutput = `m("#text", ${generateData(data)}, ${node.value})`;
  } else if(type === "m-insert") {
    callOutput = "instance.insert";
  } else {
    callOutput = `m("${type}", {`;

    // Props
    const propState = node.props;
    let propSeparator = '';

    // Attributes
    const propStateAttrs = propState.attrs;
    if(propStateAttrs.length !== 0) {
      callOutput += generateProps("attrs", propStateAttrs);
      propSeparator = ", ";
    }

    // Directives
    const propStateDirectives = propState.directives;
    if(propStateDirectives.length !== 0) {
      callOutput += generateProps(propSeparator + "directives", propStateDirectives);
      propSeparator = ", ";
    }

    // DOM Props
    const propStateDom = propState.dom;
    if(propStateDom.length !== 0) {
      callOutput += generateProps(propSeparator + "dom", propStateDom);
    }

    // Data
    callOutput += "}, " + generateData(data) + ", ";

    // Children
    let childrenOutput = '';
    let childrenSeparator = '';
    const children = node.children;
    for(let i = 0; i < children.length; i++) {
      childrenOutput += childrenSeparator + generateNode(children[i], node, state);
      childrenSeparator = ", ";
    }

    // Close children and call
    if(node.deep === true) {
      callOutput += `m.flatten([${childrenOutput}]))`;
    } else {
      callOutput += `[${childrenOutput}])`;
    }

    // Process special directives
    const propStateSpecialDirectivesAfter = propState.specialDirectivesAfter;
    for(let i = 0; i < propStateSpecialDirectivesAfter.length; i++) {
      const propStateSpecialDirectiveAfter = propStateSpecialDirectivesAfter[i];
      callOutput = propStateSpecialDirectiveAfter.after(propStateSpecialDirectiveAfter.prop, callOutput, node, parentNode, state);
    }
  }

  // Output
  if((data.flags & FLAG_STATIC) === FLAG_STATIC) {
    return generateStaticNode(callOutput, state.staticNodes);
  } else {
    return callOutput;
  }
};

const generate = function(tree) {
  let state = {
    staticNodes: [],
    dependencies: {
      props: [],
      methods: []
    },
    exclude: globals,
    locals: []
  };

  if(generateNodeState(tree, undefined, state) === false) {
    const treeData = tree.data;
    treeData.flags = treeData.flags | FLAG_STATIC;
  }

  const treeOutput = generateNode(tree, undefined, state);

  const dependencies = state.dependencies;
  const props = dependencies.props;
  const methods = dependencies.methods;
  let dependenciesOutput = '';

  let staticNodes = state.staticNodes;
  let staticNodesOutput = '';

  let i = 0;
  let separator = '';

  // Generate data prop dependencies
  for(; i < props.length; i++) {
    const propName = props[i];
    dependenciesOutput += `var ${propName} = instance.get("${propName}");`;
  }

  // Generate method dependencies
  for(i = 0; i < methods.length; i++) {
    const methodName = methods[i];
    dependenciesOutput += `var ${methodName} = instance.methods["${methodName}"];`;
  }

  // Generate static nodes
  for(i = 0; i < staticNodes.length; i++) {
    staticNodesOutput += separator + staticNodes[i];
    separator = ", ";
  }

  // Generate render function
  try {
    return new Function('m', `var instance = this;var staticNodes = instance.compiledRender.staticNodes;${dependenciesOutput}if(staticNodes === undefined) {staticNodes = instance.compiledRender.staticNodes = [${staticNodesOutput}];}return ${treeOutput};`);
  } catch(e) {
    error("Could not create render function");
    return noop;
  }
};

const defaultDirectives = {};

const hashRE = /\.|\[/;

const addEventToNode = function(eventType, eventHandler, node) {
  const data = node.data;
  let events = data.events;

  if(events === undefined) {
    events = data.events = {};
    events[eventType] = [eventHandler];
  } else {
    let eventHandlers = events[eventType];
    if(eventHandlers === undefined) {
      events[eventType] = [eventHandler];
    } else {
      eventHandlers.push(eventHandler);
    }
  }
};

const addDomPropertyToNode = function(domPropName, domPropValue, node) {
  node.props.dom.push({
    name: domPropName,
    value: domPropValue
  });
};

defaultDirectives["m-if"] = {
  before: function(prop, node, parentNode, state) {
    const children = parentNode.children;
    const nextIndex = node.index + 1;
    const nextChild = children[nextIndex];
    compileTemplateExpression(prop.value, state);

    if(nextChild !== undefined) {
      let nextChildProps = nextChild.props;
      for(let i = 0; i < nextChildProps.length; i++) {
        const nextChildProp = nextChildProps[i];
        if(nextChildProp.name === "m-else") {
          nextChildProps.splice(i, 1);

          if(generateNodeState(nextChild, parentNode, state) === false) {
            let nextChildChildren = nextChild.children;
            for(let j = 0; j < nextChildChildren.length; j++) {
              const nextChildChildData = nextChildChildren[j].data;
              nextChildChildData.flags = nextChildChildData.flags | FLAG_STATIC;
            }
          }

          prop.data.elseOutput = generateNode(nextChild, parentNode, state);
          children.splice(nextIndex, 1);
          break;
        }
      }
    }

    return true;
  },
  after: function(prop, output, node, parentNode, state) {
    let elseOutput = prop.data.elseOutput;

    if(elseOutput === undefined) {
      elseOutput = generateStaticNode(`m("#text", {flags: ${FLAG_STATIC}}, '')`, state.staticNodes);
    }

    return `${prop.value} ? ${output} : ${elseOutput}`;
  }
};

defaultDirectives["m-for"] = {
  before: function(prop, node, parentNode, state) {
    // Flatten children
    parentNode.deep = true;

    // Parts
    const parts = prop.value.split(" in ");

    // Aliases
    const aliases = trimWhitespace(parts[0]);

    // Save information
    const iteratable = parts[1];
    const propData = prop.data;
    propData.forIteratable = iteratable;
    propData.forAliases = aliases;
    state.locals = state.locals.concat(aliases.split(','));

    // Compile iteratable
    compileTemplateExpression(iteratable, state);

    return true;
  },
  after: function(prop, output, node, parentNode, state) {
    // Get information about parameters
    const propData = prop.data;

    // Use the renderLoop runtime helper
    return `m.renderLoop(${propData.forIteratable}, function(${propData.forAliases}) {return ${output};})`;
  }
};

defaultDirectives["m-on"] = {
  before: function(prop, node, parentNode, state) {
    let exclude = state.exclude;

    // Get method call
    let methodCall = prop.value;
    if(methodCall.indexOf('(') === -1) {
      methodCall += "()";
    }

    // Add event handler
    addEventToNode(prop.argument, `function(event) {${methodCall};}`, node);

    // Compile method call
    exclude.push("event");
    const dynamic = compileTemplateExpression(methodCall, state);
    exclude.pop();
    return dynamic;
  }
};

defaultDirectives["m-bind"] = {
  before: function(prop, node, parentNode, state) {
    let value = prop.value;

    const dynamicIndex = value.search(hashRE);
    let base;
    let properties;
    if(dynamicIndex !== -1) {
      base = value.substring(0, dynamicIndex);
      properties = value.substring(dynamicIndex);
      value = `instance.get("${base}")${properties}`;
    }

    let eventType = "input";
    let instanceKey = value;
    let instanceValue = "event.target.value";
    let domKey = "value";
    let domValue = value;
    let eventHandler = '';

    if(dynamicIndex === -1) {
      eventHandler = `function(event) {instance.set("${instanceKey}", ${instanceValue});}`;
    } else {
      eventHandler = `function(event) {var boundValue = instance.get("${base}");boundValue${properties} = ${instanceValue};instance.set("${base}", boundValue);}`;
    }

    addEventToNode(eventType, eventHandler, node);
    addDomPropertyToNode(domKey, domValue, node);

    return compileTemplateExpression(value, state);
  }
};

defaultDirectives["m-dom"] = {
  before: function(prop, node, parentNode, state) {
    const propValue = prop.value;
    addDomPropertyToNode(prop.argument, propValue, node);
    return compileTemplateExpression(propValue, state);
  }
};

defaultDirectives["m-literal"] = {
  during: function(prop, node, parentNode, state) {
    const argument = prop.argument;
    prop.name = argument;

    if(argument === "class") {
      prop.value = `m.renderClass(${prop.value})`;
    }

    return compileTemplateExpression(prop.value, state);
  }
};

defaultDirectives["m-mask"] = {

};

let directives = {};
let specialDirectives = defaultDirectives;
let components = {};

const addEvents = function(node, events) {
  for(let eventType in events) {
    // Create handle function
    const handle = function(event) {
      const handlers = handle.handlers;
      for(let i = 0; i < handlers.length; i++) {
        handlers[i](event);
      }
    };

    // Add handlers to handle
    handle.handlers = events[eventType];

    // Add handler to VNode
    events[eventType] = handle;

    // Add event listener
    node.addEventListener(eventType, handle);
  }
};

const createNode = function(vnode) {
  const type = vnode.type;
  let data = vnode.data;
  let node;

  if(type === "#text") {
    // Create textnode
    node = document.createTextNode(vnode.value);
  } else {
    let children = vnode.children;
    node = (data.flags & FLAG_SVG) === FLAG_SVG ? document.createElementNS("http://www.w3.org/2000/svg", type) : document.createElement(type);

    // Append all children
    for(let i = 0; i < children.length; i++) {
      appendVNode(children[i], node);
    }

    // Add all event listeners
    const events = data.events;
    if(events !== undefined) {
      addEvents(node, events);
    }

    // Add Props
    patchProps(node, undefined, vnode, vnode.props);
  }

  // Hydrate
  data.node = node;

  return node;
};

const createComponent = function(node, vnode, component) {
  const props = component.options.props;
  const attrs = vnode.props.attrs;
  let componentProps = {};

  // Get component props
  if(props !== undefined && attrs !== undefined) {
    for(let i = 0; i < props.length; i++) {
      const propName = props[i];
      componentProps[propName] = attrs[propName];
    }
  }

  // Create component options
  let componentOptions = {
    root: node,
    props: componentProps,
    insert: vnode.children
  };

  // Check for events
  const events = vnode.data.events;
  if(events === undefined) {
    componentOptions.events = {};
  } else {
    componentOptions.events = events;
  }

  // Initialize and mount instance
  const componentInstance = new component.CTor(componentOptions);

  // Update data
  const data = vnode.data;
  data.component = componentInstance;
  data.node = componentInstance.root;
};

const appendNode = function(node, parentNode) {
  parentNode.appendChild(node);
};

const appendVNode = function(vnode, parentNode) {
  const vnodeComponent = vnode.data.component;

  if(vnodeComponent === undefined) {
    appendNode(createNode(vnode), parentNode);
  } else {
    const root = document.createElement(vnode.type);
    appendNode(root, parentNode);
    createComponent(root, vnode, vnodeComponent);
  }
};

const removeNode = function(node, parentNode) {
  parentNode.removeChild(node);
};

const removeVNode = function(vnode, parentNode) {
  const vnodeData = vnode.data;
  const vnodeComponentInstance = vnodeData.component;

  if(vnodeComponentInstance !== undefined) {
    vnodeComponentInstance.destroy();
  }

  removeNode(vnodeData.node, parentNode);
};

const replaceNode = function(newNode, oldNode, parentNode) {
  parentNode.replaceChild(newNode, oldNode);
};

const replaceVNode = function(newVNode, oldVNode, parentNode) {
  const oldVNodeData = oldVNode.data;
  const oldVNodeComponentInstance = oldVNodeData.component;

  if(oldVNodeComponentInstance !== undefined) {
    oldVNodeComponentInstance.destroy();
  }

  const newVNodeComponent = newVNode.data.component;
  if(newVNodeComponent === undefined) {
    replaceNode(createNode(newVNode), oldVNodeData.node, parentNode);
  } else {
    createComponent(oldVNodeData.node, newVNode, newVNodeComponent);
  }
};

const m = function(type, props, data, children) {
  if(type === "#text") {
    // Text virtual node
    return {
      type: type,
      data: props,
      value: data
    };
  } else {
    let component = components[type];
    if(component !== undefined) {
      // Component
      data.component = component;
    }

    // Virtual node
    return {
      type: type,
      props: props,
      data: data,
      children: children
    };
  }
};

m.flatten = function(children) {
  for(let i = 0; i < children.length; ) {
    let child = children[i];
    if(Array.isArray(child) === true) {
      const childLength = child.length;
      child.unshift(i, 1);
      children.splice.apply(children, child);
      child.slice(2, 0);
      i += childLength;
    } else {
      i++;
    }
  }

  return children;
};

m.renderClass = function(classNames) {
  if(typeof classNames === "string") {
    // String class names are already processed
    return classNames;
  } else {
    let renderedClassNames = '';
    let separator = '';
    if(Array.isArray(classNames) === true) {
      // It's an array concatenate them
      for(let i = 0; i < classNames.length; i++) {
        renderedClassNames += separator + m.renderClass(classNames[i]);
        separator = ' ';
      }
    } else if(typeof classNames === "object") {
      // Object of classnames, concatenate if value is true
      for(let className in classNames) {
        if(classNames[className] === true) {
          renderedClassNames += separator + className;
          separator = ' ';
        }
      }
    }

    return renderedClassNames;
  }
};

m.renderLoop = function(iteratable, item) {
  let items;

  if(Array.isArray(iteratable)) {
    // Render array
    const length = iteratable.length;
    items = new Array(length);
    for(let i = 0; i < length; i++) {
      items[i] = item(iteratable[i], i);
    }
  } else if(typeof iteratable === "object") {
    // Render object
    items = [];
    for(let key in iteratable) {
      items.push(item(iteratable[key], key));
    }
  } else if(typeof iteratable === "number") {
    // Render range
    items = new Array(iteratable);
    for(let i = 0; i < iteratable; i++) {
      items[i] = item(i + 1, i);
    }
  }

  return items;
};

const patchProps = function(node, nodeAttrs, vnode, props) {
  // Get VNode Attributes
  const vnodeAttrs = props.attrs;

  if(vnodeAttrs === undefined) {
    if(nodeAttrs !== undefined) {
      // Remove all
      for(let nodeAttrName in nodeAttrs) {
        node.removeAttribute(nodeAttrName);
      }
    }
  } else {
    if(nodeAttrs === undefined) {
      // Add all
      for(let vnodeAttrName in vnodeAttrs) {
        const vnodeAttrValue = vnodeAttrs[vnodeAttrName];
        node.setAttribute(vnodeAttrName, vnodeAttrValue === true ? '' : vnodeAttrValue);
      }
    } else {
      // Add
      for(let vnodeAttrName in vnodeAttrs) {
        const vnodeAttrValue = vnodeAttrs[vnodeAttrName];
        const nodeAttrValue = nodeAttrs[vnodeAttrName];

        if((vnodeAttrValue !== false) && (nodeAttrValue === undefined || vnodeAttrValue !== nodeAttrValue)) {
          node.setAttribute(vnodeAttrName, vnodeAttrValue === true ? '' : vnodeAttrValue);
        }
      }

      // Remove
      for(let nodeAttrName in nodeAttrs) {
        const vnodeAttrValue = vnodeAttrs[nodeAttrName];
        if(vnodeAttrValue === undefined || vnodeAttrValue === false) {
          node.removeAttribute(nodeAttrName);
        }
      }
    }
  }

  // Execute any directives
  let vnodeDirectives = props.directives;
  if(vnodeDirectives !== undefined) {
    for(let directiveName in vnodeDirectives) {
      let directive = directives[directiveName];
      if(directive !== undefined) {
        directive(node, vnodeDirectives[directiveName], vnode);
      } else {
        error(`Could not find directive "${directiveName}"`);
      }
    }
  }

  // Add/Update any DOM Props
  const domProps = props.dom;
  if(domProps !== undefined) {
    for(let domPropName in domProps) {
      node[domPropName] = domProps[domPropName];
    }
  }
};

const patchEvents = function(newEvents, oldEvents) {
  // Update event handlers
  for(let eventType in newEvents) {
    oldEvents[eventType].handlers = newEvents[eventType];
  }
};

const patchChildren = function(newChildren, oldChildren, parentNode) {
  const newLength = newChildren.length;
  const oldLength = oldChildren.length;
  const totalLength = newLength > oldLength ? newLength : oldLength;

  for(let i = 0; i < totalLength; i++) {
    if(i >= newLength) {
      // Past length of new children, remove child
      removeVNode(oldChildren.pop(), parentNode);
    } else if(i >= oldLength) {
      // Past length of old children, append child
      appendVNode((oldChildren[i] = newChildren[i]), parentNode);
    } else {
      const newChild = newChildren[i];
      const oldChild = oldChildren[i];

      if(newChild !== oldChild) {
        const newChildType = newChild.type;
        if(newChildType !== oldChild.type) {
          // Types are different, replace child
          replaceVNode(newChild, oldChild, parentNode);
          oldChildren[i] = newChild;
        } else {
          const oldChildData = oldChild.data;
          const oldChildComponentInstance = oldChildData.component;
          if(oldChildComponentInstance !== undefined) {
            // Component found
            let componentChanged = false;

            const oldChildComponentInstanceProps = oldChildComponentInstance.options.props;
            if(oldChildComponentInstanceProps !== undefined) {
              // Update component props
              const newChildAttrs = newChild.props.attrs;
              const oldChildComponentInstanceObserver = oldChildComponentInstance.observer;
              let oldChildComponentInstanceData = oldChildComponentInstance.data;

              for(let j = 0; j < oldChildComponentInstanceProps.length; j++) {
                const oldChildComponentInstancePropName = oldChildComponentInstanceProps[j];
                oldChildComponentInstanceData[oldChildComponentInstancePropName] = newChildAttrs[oldChildComponentInstancePropName];
                oldChildComponentInstanceObserver.notify(oldChildComponentInstancePropName);
              }

              componentChanged = true;
            }

            // Patch component events
            const newChildEvents = newChild.data.events;
            if(newChildEvents !== undefined) {
              patchEvents(newChildEvents, oldChildData.events);
            }

            // Add insert
            const newChildChildren = newChild.children;
            if(newChildChildren.length !== 0) {
              oldChildComponentInstance.insert = newChildChildren;
              componentChanged = true;
            }

            // Build component if changed
            if(componentChanged === true) {
              oldChildComponentInstance.build();
              callHook(oldChildComponentInstance, "updated");
            }
          } else if(newChildType === "#text") {
            // Text node, update value
            const newChildValue = newChild.value;
            oldChildData.node.textContent = newChildValue;
            oldChild.value = newChildValue;
          } else {
            // Patch child
            patch(newChild, oldChild);
          }
        }
      }
    }
  }
};

const hydrate = function(node, vnode) {
  let vnodeData = vnode.data;

  // Add reference to node
  vnodeData.node = node;

  // Patch props
  const vnodeProps = vnode.props;
  const nodeAttributes = node.attributes;
  let nodeAttrs = {};
  for(let i = 0; i < nodeAttributes.length; i++) {
    const nodeAttribute = nodeAttributes[i];
    nodeAttrs[nodeAttribute.name] = nodeAttribute.value;
  }
  patchProps(node, nodeAttrs, vnode, vnodeProps);

  // Add events
  const vnodeEvents = vnodeData.events;
  if(vnodeEvents !== undefined) {
    addEvents(node, vnodeEvents);
  }

  // Hydrate children
  const vnodeDomProps = vnodeProps.dom;
  if((vnodeDomProps === undefined) || (vnodeDomProps.innerHTML === undefined && vnodeDomProps.textContent === undefined)) {
    const vnodeChildren = vnode.children;
    const vnodeChildrenLength = vnodeChildren.length;

    let i = 0;

    let childVNode = i === vnodeChildrenLength ? undefined : vnodeChildren[i];
    let childNode = node.firstChild;

    while(childVNode !== undefined || childNode !== null) {
      if(childNode === null) {
        // Node doesn't exist, create and append a node
        appendVNode(childVNode, node);
      } else {
        let nextSibling = childNode.nextSibling;

        if(childVNode === undefined) {
          // No VNode, remove the node
          removeNode(childNode, node);
        } else {
          const childVNodeComponent = childVNode.data.component;
          if(childVNodeComponent !== undefined) {
            // Create a component
            createComponent(childNode, childVNode, childVNodeComponent);
          } else {
            const childVNodeType = childVNode.type;
            if(childNode.nodeName.toLowerCase() !== childVNodeType) {
              // Different types, replace nodes
              replaceNode(createNode(childVNode), childNode, node);
            } else if(childVNodeType === "#text") {
              // Text node, update
              childNode.textContent = childVNode.value;
              childVNode.data.node = childNode;
            } else {
              // Hydrate
              hydrate(childNode, childVNode);
            }
          }
        }

        childNode = nextSibling;
      }

      childVNode = ++i < vnodeChildrenLength ? vnodeChildren[i] : undefined;
    }
  }
};

const patch = function(newVNode, oldVNode) {
  const oldVNodeData = oldVNode.data;
  const oldVNodeNode = oldVNodeData.node;

  // Patch props
  const newVNodeProps = newVNode.props;
  patchProps(oldVNodeNode, oldVNode.props.attrs, newVNode, newVNodeProps);
  oldVNode.props = newVNodeProps;

  // Patch events
  const newVNodeEvents = newVNode.data.events;
  if(newVNodeEvents !== undefined) {
    patchEvents(newVNodeEvents, oldVNodeData.events);
  }

  // Patch children
  patchChildren(newVNode.children, oldVNode.children, oldVNodeNode);
};

const lex = function(template) {
  const length = template.length;
  let tokens = [];
  let current = 0;

  while(current < length) {
    let char = template[current];
    if(char === '<') {
      current++;
      if(template.substring(current, current + 3) === "!--") {
        // Comment
        current += 3;
        const endOfComment = template.indexOf("-->", current);
        if(endOfComment === -1) {
          current = length;
        } else {
          current = endOfComment + 3;
        }
      } else {
        // Tag
        let tagToken = {
          type: "Tag",
          value: ''
        };

        let tagType = '';
        let attributes = [];

        let closeStart = false;
        let closeEnd = false;

        char = template[current];

        // Exit starting closing slash
        if(char === '/') {
          char = template[++current];
          closeStart = true;
        }

        // Get tag name
        while((current < length) && ((char !== '>') && (char !== '/') && (whitespaceCharRE.test(char) === false))) {
          tagType += char;
          char = template[++current];
        }

        // Iterate to end of tag
        while((current < length) && ((char !== '>') && (char !== '/' || template[current + 1] !== '>'))) {
          if(whitespaceCharRE.test(char) === true) {
            // Skip whitespace
            char = template[++current];
          } else {
            // Find attribute name
            let attrName = '';
            let attrValue = '';
            while((current < length) && ((char !== '=') && (whitespaceCharRE.test(char) === false) && ((char !== '>') && (char !== '/' || template[current + 1] !== '>')))) {
              attrName += char;
              char = template[++current];
            }

            // Find attribute value
            if(char === '=') {
              char = template[++current];

              let quoteType = ' ';
              if(char === '"' || char === '\'' || char === ' ' || char === '\n') {
                quoteType = char;
                char = template[++current];
              }

              // Iterate to end of quote type, or end of tag
              while((current < length) && ((char !== '>') && (char !== '/' || template[current + 1] !== '>'))) {
                if(char === quoteType) {
                  char = template[++current];
                  break;
                } else {
                  attrValue += char;
                  char = template[++current];
                }
              }
            }

            attrName = attrName.split(':');
            attributes.push({
              name: attrName[0],
              value: attrValue,
              argument: attrName[1],
              data: {}
            });
          }
        }

        if(char === '/') {
          current += 2;
          closeEnd = true;
        } else {
          current++;
        }

        tagToken.value = tagType;
        tagToken.attributes = attributes;
        tagToken.closeStart = closeStart;
        tagToken.closeEnd = closeEnd;
        tokens.push(tagToken);
      }
    } else {
      // Text
      const textTail = template.substring(current);
      const endOfText = textTail.search(tagOrCommentStartRE);
      let text;
      if(endOfText === -1) {
        text = textTail;
        current = length;
      } else {
        text = textTail.substring(0, endOfText);
        current += endOfText;
      }
      if(trimWhitespace(text).length !== 0) {
        tokens.push({
          type: "Text",
          value: text.replace(escapeRE, function(match) {
            return escapeMap[match];
          })
        });
      }
    }
  }

  return tokens;
};

const parse = function(tokens) {
  let root = {
    type: "ROOT",
    props: {},
    children: []
  };
  let elements = [root];
  let lastIndex = 0;

  for(let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if(token.type === "Text") {
      // Push text to currently pending element
      elements[lastIndex].children.push({
        type: "#text",
        data: {
          flags: 0
        },
        value: token.value
      });
    } else if(token.type === "Tag") {
      // Tag found
      if(token.closeStart === true) {
        if("production" !== "production" && token.value !== elements[lastIndex].type) {
          error(`The element "${elements[lastIndex].type}" was left unclosed`);
        }
        // Closing tag found, close current element
        elements.pop();
        lastIndex--;
      } else {
        // Opening tag found, create element
        const type = token.value;
        const lastChildren = elements[lastIndex].children;
        const index = lastChildren.length;

        let node = {
          type: type,
          index: index,
          props: token.attributes,
          data: {
            flags: 0
          },
          children: []
        };

        lastChildren[index] = node;

        // Add to stack if element is a non void element
        if(token.closeEnd === false && VOID_ELEMENTS.indexOf(type) === -1) {
          elements.push(node);
          lastIndex++;
        }
      }
    }
  }

  if("production" !== "production" && root.children[0].type === "#text") {
    error("The root element cannot be text");
  }
  return root.children[0];
};

const compile$1 = function(template) {
  return generate(parse(lex(template)));
};

const config = {
  silent: ("production" === "production") || (typeof console === "undefined")
};

const version = "0.11.0";

const util = {
  noop: noop,
  log: log,
  error: error,
  m: m
};

const use = function(plugin, options) {
  plugin.init(Moon$1, options);
};

const compile$$1 = function(template) {
  return compile$1(template);
};

const nextTick = function(task) {
  setTimeout(task, 0);
};

const directive = function(name, action) {
  directives["m-" + name] = action;
};

const extend = function(name, options) {
  options.name = name;

  if(options.data !== undefined && typeof options.data !== "function") {
    error("In components, data must be a function returning an object");
  }

  function MoonComponent(componentOptions) {
    this.componentOptions = componentOptions;
    Moon$1.apply(this, [options]);
  }

  MoonComponent.prototype = Object.create(Moon$1.prototype);
  MoonComponent.prototype.constructor = MoonComponent;

  MoonComponent.prototype.init = function() {
    const componentOptions = this.componentOptions;
    const props = componentOptions.props;
    let data = this.data;

    for(let prop in props) {
      data[prop] = props[prop];
    }

    this.events = componentOptions.events;
    this.insert = componentOptions.insert;

    callHook(this, "init");

    let root = componentOptions.root;
    if(root !== undefined) {
      this.mount(root);
    }
  };

  components[name] = {
    CTor: MoonComponent,
    options: options
  };

  return MoonComponent;
};

var globalApi = {config, version, util, use, compile: compile$$1, nextTick, directive, extend};

const get = function(key) {
  // Collect dependencies if currently collecting
  const observer = this.observer;
  let map = observer.map;
  let target = observer.target;

  if(target !== undefined) {
    if(map[key] === undefined) {
      map[key] = [target];
    } else if(map[key].indexOf(target) === -1) {
      map[key].push(target);
    }
  }

  // Return value
  if("production" !== "production" && this.data.hasOwnProperty(key) === false) {
    error(`The item "${key}" was referenced but not defined`);
  }
  return this.data[key];
};

const set = function(key, value) {
  // Get observer
  const observer = this.observer;

  if(typeof key === "object") {
    // Shallow merge
    let data = this.data;
    for(let prop in key) {
      // Set value
      data[prop] = key[prop];

      // Notify observer of change
      observer.notify(prop);
    }
  } else {
    // Set value
    this.data[key] = value;

    // Notify observer of change
    observer.notify(key);
  }

  // Queue a build
  queueBuild(this);
};

const destroy = function() {
  // Remove event listeners
  this.off();

  // Remove reference to element
  this.root = undefined;

  // Queue
  this.queued = true;

  // Call destroyed hook
  callHook(this, "destroyed");
};

// Event Emitter, adapted from https://github.com/kbrsh/voke

const on = function(eventType, handler) {
  let events = this.events;
  let handlers = events[eventType];

  if(handlers === undefined) {
    // Create handler
    events[eventType] = [handler];
  } else {
    // Add handler
    handlers.push(handler);
  }
};

const off = function(eventType, handler) {
  if(eventType === undefined) {
    // No event name provided, remove all events
    this.events = {};
  } else if(handler === undefined) {
    // No handler provided, remove all handlers for the event name
    this.events[eventType] = [];
  } else {
    // Get handlers from event name
    let handlers = this.events[eventType];

    // Get index of the handler to remove
    const index = handlers.indexOf(handler);

    // Remove the handler
    handlers.splice(index, 1);
  }
};

const emit = function(eventType, data) {
  // Events
  const events = this.events;

  // Get handlers and global handlers
  let handlers = events[eventType];
  let globalHandlers = events['*'];

  // Counter
  let i;

  // Call all handlers for the event name
  if(handlers !== undefined) {
    for(i = 0; i < handlers.length; i++) {
      handlers[i](data);
    }
  }

  if(globalHandlers !== undefined) {
    // Call all of the global handlers if present
    for(i = 0; i < globalHandlers.length; i++) {
      globalHandlers[i](eventType, data);
    }
  }
};

const mount = function(rootOption) {
  // Get root from the DOM
  let root = this.root = typeof rootOption === "string" ? document.querySelector(rootOption) : rootOption;
  if("production" !== "production" && root === null) {
    error("Element " + this.options.root + " not found");
  }

  // Setup template as provided `template` or outerHTML of the node
  defineProperty(this, "template", this.options.template, root.outerHTML);

  // Setup render Function
  if(this.compiledRender === noop) {
    this.compiledRender = Moon.compile(this.template);
  }

  // Remove queued state
  this.queued = false;

  // Hydrate
  const dom = this.render();
  if(root.nodeName.toLowerCase() === dom.type) {
    hydrate(root, dom);
  } else {
    const newRoot = createNode(dom);
    replaceNode(newRoot, root, root.parentNode);
    this.root = newRoot;
  }

  this.dom = dom;

  // Call mounted hook
  callHook(this, "mounted");
};

const render = function() {
  return this.compiledRender(m);
};

const build = function() {
  const dom = this.render();
  let old = this.dom;

  if(dom !== old) {
    patch(dom, old);
  }
};

const init = function() {
  log("======= Moon =======");
  callHook(this, "init");

  const root = this.options.root;
  if(root !== undefined) {
    this.mount(root);
  }
};

var instanceMethods = {get, set, destroy, on, off, emit, mount, render, build, init};

function Observer() {
  // Property currently being observed
  this.target = undefined;
  
  // Computed property cache
  this.cache = {};

  // Dependency Map
  this.map = {};
}

Observer.prototype.notify = function(key) {
  // Notify all dependent keys
  let map = this.map[key];
  if(map !== undefined) {
    for(let i = 0; i < map.length; i++) {
      this.notify(map[i]);
    }
  }

  // Clear cache for key
  let cache = this.cache;
  if(cache[key] !== undefined) {
    cache[key] = undefined;
  }
};

const initMethods = function(instance, methods) {
  let instanceMethods = instance.methods;
  for(let methodName in methods) {
    // Change context of method
    instanceMethods[methodName] = function() {
      return methods[methodName].apply(instance, arguments);
    };
  }
};

const initComputed = function(instance, computed) {
  // Set all computed properties
  const data = instance.data;
  const observer = instance.observer;
  for(let propName in computed) {
    const option = computed[propName];
    const getter = option.get;
    const setter = option.set;

    // Add getter/setter
    Object.defineProperty(data, propName, {
      get: function() {
        // Property Cache
        let cache;

        if(observer.cache[propName] === undefined) {
          // Capture dependencies
          observer.target = propName;

          // Invoke getter
          cache = getter.call(instance);

          // Stop capturing dependencies
          observer.target = undefined;

          // Store value in cache
          observer.cache[propName] = cache;
        } else {
          // Use cached value
          cache = observer.cache[propName];
        }

        return cache;
      },
      set: setter === undefined ? noop : function(val) {
        setter.call(instance, val);
      }
    });
  }
};

"use strict";

function Moon$1(options) {
  /* ======= Initial Values ======= */

  // Options
  if(options === undefined) {
    options = {};
  }
  this.options = options;

  // Name/ID
  defineProperty(this, "name", options.name, "Root");

  // Root DOM Node
  this.root = undefined;

  // Data
  const data = options.data;
  if(data === undefined) {
    this.data = {};
  } else if(typeof data === "function") {
    this.data = data();
  } else {
    this.data = data;
  }

  // Methods
  const methods = options.methods;
  this.methods = {};
  if(methods !== undefined) {
    initMethods(this, methods);
  }

  // Compiled render function
  defineProperty(this, "compiledRender", options.render, noop);

  // Hooks
  defineProperty(this, "hooks", options.hooks, {});

  // Events
  this.events = {};

  // Virtual DOM
  this.dom = {};

  // Observer
  this.observer = new Observer();

  // Queued state
  this.queued = true;

  // Initialize computed properties
  const computed = options.computed;
  if(computed !== undefined) {
    initComputed(this, computed);
  }

  // Initialize
  this.init();
}

Moon$1.prototype.get = instanceMethods.get;
Moon$1.prototype.set = instanceMethods.set;
Moon$1.prototype.destroy = instanceMethods.destroy;
Moon$1.prototype.on = instanceMethods.on;
Moon$1.prototype.off = instanceMethods.off;
Moon$1.prototype.emit = instanceMethods.emit;
Moon$1.prototype.mount = instanceMethods.mount;
Moon$1.prototype.render = instanceMethods.render;
Moon$1.prototype.build = instanceMethods.build;
Moon$1.prototype.init = instanceMethods.init;

Moon$1.config = globalApi.config;
Moon$1.version = globalApi.version;
Moon$1.util = globalApi.util;
Moon$1.use = globalApi.use;
Moon$1.compile = globalApi.compile;
Moon$1.nextTick = globalApi.nextTick;
Moon$1.directive = globalApi.directive;
Moon$1.extend = globalApi.extend;

export default Moon$1;
