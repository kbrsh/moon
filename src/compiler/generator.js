const generateStaticNode = function(nodeOutput, staticNodes) {
  const staticNodesLength = staticNodes.length;
  staticNodes[staticNodesLength] = nodeOutput;
  return `staticNodes[${staticNodesLength}]`;
}

const generateNode = function(node, parentNode, state) {
  const type = node.type;
  if(type === "#text") {
    // Text node
    const compiled = compileTemplate(node.value, state);
    return {
      output: `m("#text", ${compiled.output})`,
      dynamic: compiled.dynamic
    };
  } else if(type === "m-insert") {
    parentNode.deep = true;
    return {
      output: "instance.insert",
      dynamic: true
    };
  } else {
    let callOutput = `m("${type}", {`;
    let dynamic = false;
    let separator = '';
    let data = node.data = {};

    // Mark SVG elements
    if(SVG_ELEMENTS.indexOf(type) !== -1) {
      data.SVG = 1;
    }

    // Generate props
    const props = node.props;
    const attrs = props.attrs;
    let generateAttrs = [];
    let generateDirectives = [];
    let specialDirective;
    let specialDirectivesAfter = [];
    let attrName;
    let attr;
    let i;

    // Invoke special directives to generate before
    let before;
    for(attrName in attrs) {
      attr = attrs[attrName];
      if((specialDirective = specialDirectives[attr.name]) !== undefined && (before = specialDirective.before) !== undefined) {
        if(before(attr, node, parentNode, state) === true) {
          dynamic = true;
        }
      }
    }

    // Process other attributes
    for(attrName in attrs) {
      attr = attrs[attrName];
      specialDirective = specialDirectives[attr.name];
      if(specialDirective !== undefined) {
        const after = specialDirective.after;
        if(after !== undefined) {
          // After generation
          specialDirectivesAfter.push({
            attr: attr,
            after: after
          });
        }

        const during = specialDirective.during;
        if(during !== undefined) {
          // During generation
          const duringProp = during(attr, node, parentNode, state);
          const duringPropOutput = duringProp.output;
          if(duringPropOutput !== undefined) {
            if(duringProp.dynamic === true) {
              dynamic = true;
            }
            generateAttrs.push(duringPropOutput);
          }
        }
      } else if(attrName[0] === 'm' && attrName[1] === '-') {
        // Directive
        generateDirectives.push(attr);
      } else {
        // Attribute
        generateAttrs.push(attr);
      }
    }

    // Generate attributes
    const generateAttrsLength = generateAttrs.length;
    let existingPropType = false;
    if(generateAttrsLength !== 0) {
      // Add attributes object
      callOutput += "attrs: {";

      for(i = 0; i < generateAttrsLength; i++) {
        // Generate attribute name and value
        attr = generateAttrs[i];

        if(typeof attr === "string") {
          // During generation literal property
          callOutput += separator + attr;
        } else {
          // Normal property
          const compiledAttr = compileTemplate(attr.value, state);
          if(compiledAttr.dynamic === true) {
            dynamic = true;
          }
          callOutput += `${separator}"${attr.name}": ${compiledAttr.output}`;
        }

        separator = ", ";
      }

      // Close attributes object
      separator = '';
      callOutput += '}';
      existingPropType = true;
    }

    // Generate directives
    const generateDirectivesLength = generateDirectives.length;
    if(generateDirectivesLength !== 0) {
      // Add directives object to props
      if(existingPropType === true) {
        callOutput += ", directives: {";
      } else {
        callOutput += "directives: {";
        existingPropType = true;
      }

      for(i = 0; i < generateDirectivesLength; i++) {
        // Generate directive name and value
        attr = generateDirectives[i];

        let directiveValue = attr.value;
        if(directiveValue.length === 0) {
          directiveValue = "\"\"";
        } else if(compileTemplateExpression(directiveValue, state) === true) {
          dynamic = true;
        }

        callOutput += `${separator}"${attr.name}": ${directiveValue}`;
        separator = ", ";
      }

      // Close directives object
      separator = '';
      callOutput += '}';
    }

    const domProps = props.dom;
    if(domProps !== undefined) {
      // Add dom object to props
      callOutput += existingPropType === true ? ", dom: {" : "dom: {";

      for(let domPropName in domProps) {
        // Generate dom property name and value
        const domPropValue = domProps[domPropName];
        if(compileTemplateExpression(domPropValue, state) === true) {
          dynamic = true;
        }
        callOutput += `${separator}"${domPropName}": ${domPropValue}`;
        separator = ", ";
      }

      // Close dom object
      separator = '';
      callOutput += '}';
    }

    // Close props object, start data object
    callOutput += "}, {";

    let events = data["events"];
    let eventHandlerSeparator = '';
    if(events !== undefined) {
      // Add events object to data
      callOutput += "events: {";

      for(let eventType in events) {
        // Add event type and open handlers array
        callOutput += `${separator}"${eventType}": [`;

        let handlers = events[eventType];
        for(i = 0; i < handlers.length; i++) {
          // Add handler
          callOutput += eventHandlerSeparator + handlers[i];
          eventHandlerSeparator = ", ";
        }

        // Close event type
        separator = ", ";
        eventHandlerSeparator = '';
        callOutput += ']';
      }

      // Close events object
      callOutput += '}';
      delete data["events"];
    }

    for(let key in data) {
      // Generate data key and value
      callOutput += `${separator}${key}: ${data[key]}`;
      separator = ", ";
    }

    // Close data
    callOutput += "}, ";

    // Generate children
    const children = node.children;
    let generatedChildren = [];
    let childrenOutput = '';
    separator = '';
    for(i = 0; i < children.length; i++) {
      // Generate child node
      const generatedChild = generateNode(children[i], node, state);

      if(generatedChild.dynamic === true) {
        dynamic = true;
      }

      generatedChildren.push(generatedChild);
    }

    let staticNodes = state.staticNodes;
    for(i = 0; i < generatedChildren.length; i++) {
      const generatedChild = generatedChildren[i];
      if(dynamic === true && generatedChild.dynamic === false) {
        childrenOutput += `${separator}${generateStaticNode(generatedChild.output, staticNodes)}`;
      } else {
        childrenOutput += separator + generatedChild.output;
      }

      separator = ", ";
    }

    // Close children and call
    if(node.deep === true) {
      callOutput += `m.flatten([${childrenOutput}]))`;
    } else {
      callOutput += `[${childrenOutput}])`;
    }

    // Process special directives
    for(i = 0; i < specialDirectivesAfter.length; i++) {
      const specialDirectiveAfter = specialDirectivesAfter[i];
      callOutput = specialDirectiveAfter.after(specialDirectiveAfter.attr, callOutput, node, parentNode, state);
    }

    return {
      output: callOutput,
      dynamic: dynamic
    };
  }
}

const generate = function(tree) {
  let state = {
    staticNodes: [],
    exclude: globals,
    dependencies: {
      props: [],
      methods: []
    }
  };

  let treeOutput = generateNode(tree, undefined, state);

  const dependencies = state.dependencies;
  const props = dependencies.props;
  const methods = dependencies.methods;
  let dependenciesOutput = '';

  let staticNodes = state.staticNodes;
  let staticNodesOutput = '';

  let i = 0;
  let separator = '';

  if(treeOutput.dynamic === true) {
    treeOutput = treeOutput.output;
  } else {
    staticNodes[0] = treeOutput.output;
    treeOutput = `staticNodes[0]`;
  }

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
