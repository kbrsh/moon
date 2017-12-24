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
}

const addDomPropertyToNode = function(domPropName, domPropValue, node) {
  node.props.dom.push({
    name: domPropName,
    value: domPropValue
  });
}

specialDirectives["m-if"] = {
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

specialDirectives["m-for"] = {
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

specialDirectives["m-on"] = {
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

specialDirectives["m-bind"] = {
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

specialDirectives["m-dom"] = {
  before: function(prop, node, parentNode, state) {
    const propValue = prop.value;
    addDomPropertyToNode(prop.argument, propValue, node);
    return compileTemplateExpression(propValue, state);
  }
};

specialDirectives["m-literal"] = {
  during: function(prop, node, parentNode, state) {
    const argument = prop.argument;
    prop.name = argument;

    if(argument === "class") {
      prop.value = `m.renderClass(${prop.value})`;
    }

    return compileTemplateExpression(prop.value, state);
  }
};

specialDirectives["m-mask"] = {

};
