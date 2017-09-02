const openRE = /\{\{/;
const closeRE = /\s*\}\}/;
const whitespaceRE = /\s/;
const expressionRE = /"[^"]*"|'[^']*'|\.\w*[a-zA-Z$_]\w*|\w*[a-zA-Z$_]\w*:|(\w*[a-zA-Z$_]\w*)/g;
const globals = ["true", "false", "undefined", "null", "NaN", "typeof", "in", "event"];

/**
 * Compiles a Template
 * @param {String} template
 * @param {Array} exclude
 * @param {Array} dependencies
 * @return {String} compiled template
 */
const compileTemplate = function(template, exclude, dependencies) {
  let state = {
    current: 0,
    template: template,
    exclude: exclude,
    dependencies: dependencies
  };

  return compileTemplateState(state);
}

const compileTemplateState = function(state) {
  const template = state.template;
  const length = template.length;
  let output = "";
  while(state.current < length) {
    // Match Text Between Templates
    const value = scanTemplateStateUntil(state, openRE);

    if(value.length !== 0) {
      output += value;
    }

    // If we've reached the end, there are no more templates
    if(state.current === length) {
      break;
    }

    // Exit Opening Delimiter
    state.current += 2;

    // Consume whitespace
    scanTemplateStateForWhitespace(state);

    // Get the value of the expression
    let name = scanTemplateStateUntil(state, closeRE);

    // If we've reached the end, the tag was unclosed
    if(state.current === length) {
      if("__ENV__" !== "production") {
        error(`Expected closing delimiter "}}" after "${name}"`);
      }
      break;
    }

    if(name.length !== 0) {
      // Extract Variable References
      compileTemplateExpression(name, state.exclude, state.dependencies);

      // Add quotes
      name = `" + ${name} + "`;

      // Generate code
      output += name;
    }

    // Consume whitespace
    scanTemplateStateForWhitespace(state);

    // Exit closing delimiter
    state.current += 2;
  }

  return output;
}

const compileTemplateExpression = function(expression, exclude, dependencies) {
  let dynamic = false;
  let references;
  while((references = expressionRE.exec(expression)) !== null) {
    let reference = references[1];
    if(reference !== undefined && dependencies.indexOf(reference) === -1) {
      if(exclude.indexOf(reference) === -1) {
        dependencies.push(reference);
      }
      dynamic = true;
    }
  }

  return dynamic;
}

const scanTemplateStateUntil = function(state, re) {
  const template = state.template;
  const tail = template.substring(state.current);
  const index = tail.search(re);

  let match = "";

  switch(index) {
    case -1:
      match = tail;
      break;
    case 0:
      match = '';
      break;
    default:
      match = tail.substring(0, index);
  }

  state.current += match.length;

  return match;
}

const scanTemplateStateForWhitespace = function(state) {
  const template = state.template;
  let char = template[state.current];
  while(whitespaceRE.test(char) === true) {
    char = template[++state.current];
  }
}
