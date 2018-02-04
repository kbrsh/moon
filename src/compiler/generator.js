import {error, noop} from "../util/util.js";
import {specialDirectives} from "../global/var.js";
import {compileTemplateExpression, compileTemplate} from "./template.js";
import {globals, SVG_ELEMENTS, FLAG_STATIC, FLAG_SVG} from "./constants.js";

export const generateStaticNode = function(nodeOutput, staticNodes) {
  const staticNodesLength = staticNodes.length;
  staticNodes[staticNodesLength] = nodeOutput;
  return `staticNodes[${staticNodesLength}]`;
}

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
}

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
}

export const generateNodeState = function(node, parentNode, state) {
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
}

export const generateNode = function(node, parentNode, state) {
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
}

export const generate = function(tree) {
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
}
