const closeCall = function(code, add) {
  return code.substring(0, code.length - 2) + add;
}

const generateProps = function(node, parent, specialDirectivesAfter, state) {
  const props = node.props;
  node.props = {
    attrs: props
  }

  let hasAttrs = false;

  let hasDirectives = false;
  let directiveProps = [];

  let propKey;
  let specialDirective;

  let propsCode = "{attrs: {";

  let beforeGenerate;
  for(propKey in props) {
    const prop = props[propKey];
    const name = prop.name;
    if((specialDirective = specialDirectives[name]) !== undefined && (beforeGenerate = specialDirective.beforeGenerate) !== undefined) {
      beforeGenerate(prop, node, parent, state);
    }
  }

  let afterGenerate;
  let duringPropGenerate;
  for(propKey in props) {
    const prop = props[propKey];
    const name = prop.name;

    specialDirective = specialDirectives[name]
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
          if(hasAttrs === false) {
            hasAttrs = true;
          }

          propsCode += generated;
        }
      }

      node.meta.shouldRender = 1;
    } else if(name[0] === "m" && name[1] === "-") {
      if(hasDirectives === false) {
        hasDirectives = true;
      }

      directiveProps.push(prop);
      node.meta.shouldRender = 1;
    } else {
      const value = prop.value;
      const compiled = compileTemplate(value, state.exclude, state.dependencies);

      if(value !== compiled) {
        node.meta.shouldRender = 1;
      }

      if(hasAttrs === false) {
        hasAttrs = true;
      }

      propsCode += `"${propKey}": "${compiled}", `;
    }
  }

  if(hasAttrs === true) {
    propsCode = closeCall(propsCode, "}");
  } else {
    propsCode += "}";
  }

  if(hasDirectives === true) {
    propsCode += ", directives: {";

    for(let i = 0; i < directiveProps.length; i++) {
      let directiveProp = directiveProps[i];
      let directivePropValue = directiveProp.value;

      compileTemplateExpression(directivePropValue, state.exclude, state.dependencies);
      propsCode += `"${directiveProp.name}": ${directivePropValue.length === 0 ? `""` : directivePropValue}, `;
    }

    propsCode = closeCall(propsCode, "}");
  }

  let domProps = node.props.dom;
  if(domProps !== undefined) {
    propsCode += ", dom: {";

    for(let domProp in domProps) {
      propsCode += `"${domProp}": ${domProps[domProp]}, `;
    }

    propsCode = closeCall(propsCode, "}");
  }

  propsCode += "}, ";

  return propsCode;
}

const generateEventlisteners = function(eventListeners) {
  let eventListenersCode = "\"eventListeners\": {";

  for(let type in eventListeners) {
    let handlers = eventListeners[type];
    eventListenersCode += `"${type}": [`;

      for(let i = 0; i < handlers.length; i++) {
        eventListenersCode += `${handlers[i]}, `;
      }

      eventListenersCode = closeCall(eventListenersCode, "], ");
    }

    eventListenersCode = closeCall(eventListenersCode, "}, ");
    return eventListenersCode;
}

const generateMeta = function(meta) {
  let metaCode = "{";
  let hasMeta = false;

  for(let key in meta) {
    if(key === "eventListeners") {
      metaCode += generateEventlisteners(meta[key])
    } else {
      metaCode += `"${key}": ${meta[key]}, `;
    }
    hasMeta = true;
  }

  if(hasMeta === true) {
    metaCode = closeCall(metaCode, "}, ");
  } else {
    metaCode += "}, ";
  }

  return metaCode;
}

const generateNode = function(node, parent, index, state) {
  if(typeof node === "string") {
    const compiled = compileTemplate(node, state.exclude, state.dependencies);
    let meta = {};

    if(node !== compiled) {
      meta.shouldRender = 1;
      parent.meta.shouldRender = 1;
    } else if(state.dynamic === true) {
      meta.shouldRender = 1;
    }

    return `m("#text", ${generateMeta(meta)}"${compiled}")`;
  } else if(node.type === "m-insert") {
    parent.meta.shouldRender = 1;
    parent.deep = true;

    return "instance.insert";
  } else {
    let call = `m("${node.type}", `;
    state.index = index;

    let meta = {};
    node.meta = meta;

    if(node.custom === true || state.dynamic === true) {
      meta.shouldRender = 1;
    }

    if(node.isSVG === true) {
      meta.isSVG = 1;
    }

    let specialDirectivesAfter = {};
    const propsCode = generateProps(node, parent, specialDirectivesAfter, state);

    let children = node.children;
    let childrenCode = "[";

    if(children.length === 0) {
      childrenCode += "]";
    } else {
      for(let i = 0; i < children.length; i++) {
        childrenCode += `${generateNode(children[i], node, i, state)}, `;
      }
      childrenCode = closeCall(childrenCode, "]");
    }

    if(node.deep === true) {
      childrenCode = `[].concat.apply([], ${childrenCode})`;
    }

    if(meta.shouldRender === 1 && parent !== undefined) {
      parent.meta.shouldRender = 1;
    }

    call += propsCode;
    call += generateMeta(meta);
    call += childrenCode;
    call += ")";

    for(let specialDirectiveKey in specialDirectivesAfter) {
      let specialDirectiveAfter = specialDirectivesAfter[specialDirectiveKey];
      call = specialDirectiveAfter.afterGenerate(specialDirectiveAfter.prop, call, node, parent, state);
    }

    return call;
  }
}

const generate = function(tree) {
  let root = tree.children[0];

  let state = {
    index: 0,
    dynamic: false,
    exclude: globals,
    dependencies: []
  };

  const rootCode = generateNode(root, undefined, 0, state);

  const dependencies = state.dependencies;
  let dependenciesCode = "";

  for(let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];
    dependenciesCode += `var ${dependency} = instance.get("${dependency}"); `;
  }

  const code = `var instance = this; ${dependenciesCode}return ${rootCode};`;

  try {
    return new Function("m", code);
  } catch(e) {
    error("Could not create render function");
    return noop;
  }
}
