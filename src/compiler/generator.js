const closeCall = function(code, add) {
  return code.substring(0, code.length - 2) + add;
}

const generateProps = function(node, parent, specialDirectivesAfter, state) {
  const props = node.props.attrs;

  let dynamic = false;

  let hasAttrs = false;

  let hasDirectives = false;
  let directiveProps = [];

  let propName;
  let specialDirective;

  let propsCode = "{\"attrs\": {";

  let beforeGenerate;
  for(propName in props) {
    const prop = props[propName];
    const name = prop.name;
    if((specialDirective = specialDirectives[name]) !== undefined && (beforeGenerate = specialDirective.beforeGenerate) !== undefined) {
      beforeGenerate(prop, node, parent, state);
    }
  }

  let afterGenerate;
  let duringPropGenerate;
  for(propName in props) {
    const prop = props[propName];
    const name = prop.name;

    specialDirective = specialDirectives[name];
    if(specialDirective !== undefined) {
      afterGenerate = specialDirective.afterGenerate;
      if(afterGenerate !== undefined) {
        specialDirectivesAfter[name] = {
          prop: prop,
          afterGenerate: afterGenerate
        };
      }

      duringPropGenerate = specialDirective.duringPropGenerate;
      if(duringPropGenerate !== undefined) {
        const generated = duringPropGenerate(prop, node, parent, state);

        if(generated.length !== 0) {
          hasAttrs = true;
          propsCode += generated;
        }
      }
    } else if(name[0] === 'm' && name[1] === '-') {
      hasDirectives = true;
      dynamic = true;
      directiveProps.push(prop);
    } else {
      const value = prop.value;
      const compiled = compileTemplate(value, state.exclude, state.dependencies);

      if(compiled.dynamic === true) {
        dynamic = true;
      }

      hasAttrs = true;
      propsCode += `"${propName}": ${compiled.output}, `;
    }
  }

  if(state.static === false && dynamic === true) {
    node.data.dynamic = 1;
  }

  if(hasAttrs === true) {
    propsCode = closeCall(propsCode, '}');
  } else {
    propsCode += '}';
  }

  if(hasDirectives === true) {
    propsCode += ", \"directives\": {";

    for(let i = 0; i < directiveProps.length; i++) {
      let directiveProp = directiveProps[i];
      let directivePropValue = directiveProp.value;

      compileTemplateExpression(directivePropValue, state.exclude, state.dependencies);
      propsCode += `"${directiveProp.name}": ${directivePropValue.length === 0 ? `""` : directivePropValue}, `;
    }

    propsCode = closeCall(propsCode, '}');
  }

  let domProps = node.props.dom;
  if(domProps !== undefined) {
    propsCode += ", \"dom\": {";

    for(let domPropName in domProps) {
      propsCode += `"${domPropName}": ${domProps[domPropName]}, `;
    }

    propsCode = closeCall(propsCode, '}');
  }

  propsCode += "}, ";

  return propsCode;
}

const generateEvents = function(events) {
  let eventsCode = "\"events\": {";

  for(let eventType in events) {
    let handlers = events[eventType];
    eventsCode += `"${eventType}": [`;

    for(let i = 0; i < handlers.length; i++) {
      eventsCode += `${handlers[i]}, `;
    }

    eventsCode = closeCall(eventsCode, "], ");
  }

  eventsCode = closeCall(eventsCode, "}, ");
  return eventsCode;
}

const generateData = function(data) {
  let dataCode = '{';
  let hasData = false;

  for(let key in data) {
    if(key === "events") {
      dataCode += generateEvents(data[key]);
    } else {
      dataCode += `"${key}": ${data[key]}, `;
    }
    hasData = true;
  }

  if(hasData === true) {
    dataCode = closeCall(dataCode, "}, ");
  } else {
    dataCode += "}, ";
  }

  return dataCode;
}

const generateNode = function(node, parent, index, state) {
  if(typeof node === "string") {
    const compiled = compileTemplate(node, state.exclude, state.dependencies);
    let data = {};

    if(state.static === false) {
      if(compiled.dynamic === true || state.dynamic === true) {
        data.dynamic = 1;
        parent.data.dynamic = 1;
      }
    }

    return `m("#text", ${generateData(data)}${compiled.output})`;
  } else if(node.type === "m-insert") {
    if(state.static === false) {
      parent.data.dynamic = 1;
    }

    parent.deep = true;

    return "instance.insert";
  } else {
    let call = `m("${node.type}", `;
    state.index = index;

    let data = {};
    node.data = data;

    if(state.static === false && state.dynamic === true) {
      data.dynamic = 1;
    }

    if(node.SVG === true) {
      data.SVG = 1;
    }

    let specialDirectivesAfter = {};
    const propsCode = generateProps(node, parent, specialDirectivesAfter, state);

    let children = node.children;
    let childrenCode = '[';

    if(children.length === 0) {
      childrenCode += ']';
    } else {
      for(let i = 0; i < children.length; i++) {
        childrenCode += `${generateNode(children[i], node, i, state)}, `;
      }
      childrenCode = closeCall(childrenCode, ']');
    }

    if(node.deep === true) {
      childrenCode = `[].concat.apply([], ${childrenCode})`;
    }

    if(data.dynamic === 1 && parent !== undefined) {
      parent.data.dynamic = 1;
    }

    call += propsCode;
    call += generateData(data);
    call += childrenCode;
    call += ')';

    for(let specialDirectiveName in specialDirectivesAfter) {
      let specialDirectiveAfter = specialDirectivesAfter[specialDirectiveName];
      call = specialDirectiveAfter.afterGenerate(specialDirectiveAfter.prop, call, node, parent, state);
    }

    return call;
  }
}

const generate = function(tree) {
  let state = {
    index: 0,
    dynamic: false,
    static: false,
    exclude: globals,
    dependencies: {
      props: [],
      methods: []
    }
  };

  const treeCode = generateNode(tree, undefined, 0, state);
  const dependencies = state.dependencies;
  const props = dependencies.props;
  const methods = dependencies.methods;
  let dependenciesCode = '';
  let i = 0;

  for(; i < props.length; i++) {
    const propName = props[i];
    dependenciesCode += `var ${propName} = instance.get("${propName}");`;
  }

  for(i = 0; i < methods.length; i++) {
    const methodName = methods[i];
    dependenciesCode += `var ${methodName} = instance.methods["${methodName}"];`;
  }

  const code = `var instance = this;${dependenciesCode}return ${treeCode};`;

  try {
    return new Function('m', code);
  } catch(e) {
    error("Could not create render function");
    return noop;
  }
}
