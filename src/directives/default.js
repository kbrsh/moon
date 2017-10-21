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
  let dom = node.props.dom;
  if(dom === undefined) {
    node.props.dom = dom = {};
  }

  dom[domPropName] = domPropValue;
}

specialDirectives["m-if"] = {
  before: function(attr, node, parentNode, state) {
    const children = parentNode.children;
    const nextIndex = node.index + 1;
    const nextChild = children[nextIndex];
    let dynamic = compileTemplateExpression(attr.value, state);
    let data = attr.data;

    if(nextChild !== undefined) {
      let nextChildAttrs = nextChild.props.attrs;
      if(nextChildAttrs["m-else"] !== undefined) {
        delete nextChildAttrs["m-else"];
        data.elseNode = generateNode(nextChild, parentNode, state);
        children.splice(nextIndex, 1);
      }
    }

    if(dynamic === true) {
      const attrs = node.props.attrs;
      const ifAttr = attrs["m-if"];
      delete attrs["m-if"];
      data.ifNode = generateNode(node, parentNode, state);
      node.children = [];
      attrs["m-if"] = ifAttr;
    }

    return dynamic;
  },
  after: function(attr, output, node, parentNode, state) {
    const data = attr.data;
    const ifNode = data.ifNode;
    const elseNode = data.elseNode;
    let ifValue = output;
    let elseValue = "m.emptyVNode";
    let staticNodes = state.staticNodes;

    if(ifNode !== undefined) {
      if(ifNode.dynamic === true) {
        ifValue = ifNode.output;
      } else {
        ifValue = generateStaticNode(ifNode.output, staticNodes);
      }
    }

    if(elseNode !== undefined) {
      if(elseNode.dynamic === true) {
        elseValue = elseNode.output;
      } else {
        elseValue = generateStaticNode(elseNode.output, staticNodes);
      }
    }

    return `${attr.value} ? ${ifValue} : ${elseValue}`;
  }
};

specialDirectives["m-for"] = {
  before: function(attr, node, parentNode, state) {
    // Flatten children
    parentNode.deep = true;

    // Parts
    const parts = attr.value.split(" in ");

    // Aliases
    const aliases = parts[0];

    // Save information
    const iteratable = parts[1];
    const exclude = state.exclude;
    attr.data.forInfo = [iteratable, aliases, exclude];
    state.exclude = exclude.concat(aliases.split(','));

    return compileTemplateExpression(iteratable, state);
  },
  after: function(attr, output, node, parentNode, state) {
    // Get information about parameters
    const forInfo = attr.data.forInfo;

    // Restore globals to exclude
    state.exclude = forInfo[2];

    // Use the renderLoop runtime helper
    return `m.renderLoop(${forInfo[0]}, function(${forInfo[1]}) {return ${output};})`;
  }
};

specialDirectives["m-on"] = {
  before: function(attr, node, parentNode, state) {
    // Get event type
    const eventType = attr.argument;

    // Get method call
    let methodCall = attr.value;
    if(methodCall.indexOf('(') === -1) {
      methodCall += "(event)";
    }

    // Add event handler
    addEventToNode(eventType, `function(event) {${methodCall};}`, node);

    // Compile method call
    return compileTemplateExpression(methodCall, state);
  }
};

specialDirectives["m-bind"] = {
  before: function(attr, node, parentNode, state) {
    let value = attr.value;

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

specialDirectives["m-literal"] = {
  during: function(attr, node, parentNode, state) {
    let modifiers = attr.argument.split('.');
    const attrName = modifiers.shift();
    const attrValue = attr.value;
    let output = undefined;

    if(modifiers[0] === "dom") {
      // Literal DOM property
      addDomPropertyToNode(attrName, attrValue, node);
      return output;
    } else {
      if(attrName === "class") {
        // Render class at runtime
        output = `"class": m.renderClass(${attrValue})`;
      } else {
        // Literal attribute
        output = `"${attrName}": ${attrValue}`;
      }

      return {
        output: output,
        dynamic: compileTemplateExpression(attrValue, state)
      }
    }
  }
};

specialDirectives["m-mask"] = {

};
