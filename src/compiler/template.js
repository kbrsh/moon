const openRE = /\{\{/;
const closeRE = /\s*\}\}/;
const whitespaceRE = /\s/;
const expressionRE = /"[^"]*"|'[^']*'|\.\w*[a-zA-Z$_]\w*|\w*[a-zA-Z$_]\w*:|(\w*[a-zA-Z$_]\w*)/g;
const globals = ['true', 'false', 'undefined', 'null', 'NaN', 'typeof', 'in'];

/**
 * Compiles a Template
 * @param {String} template
 * @param {Array} dependencies
 * @param {Boolean} isString
 * @return {String} compiled template
 */
const compileTemplate = function(template, dependencies, isString) {
  let state = {
    current: 0,
    template: template,
    output: "",
    dependencies: dependencies
  };

  compileTemplateState(state, isString);

  return state.output;
}

const compileTemplateState = function(state, isString) {
  const template = state.template;
  const length = template.length;
  while(state.current < length) {
    // Match Text Between Templates
    const value = scanTemplateStateUntil(state, openRE);

    if(value.length !== 0) {
      state.output += escapeString(value);
    }

    // If we've reached the end, there are no more templates
    if(state.current === length) {
      break;
    }

    // Exit Opening Delimiter
    state.current += 2;

    // Consume whitespace
    scanTemplateStateForWhitespace(state);

    // Get the name of the opening tag
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
      compileTemplateExpression(name, state.dependencies);

      // Add quotes if string
      if(isString) {
        name = `" + ${name} + "`;
      }

      // Generate code
      state.output += name;
    }

    // Consume whitespace
    scanTemplateStateForWhitespace(state);

    // Exit closing delimiter
    state.current += 2;
  }
}

const compileTemplateExpression = function(expr, dependencies) {
  expr.replace(expressionRE, function(match, reference) {
    if(reference !== undefined && dependencies.indexOf(reference) === -1 && globals.indexOf(reference) === -1) {
      dependencies.push(reference);
    }
  });

  return dependencies;
}

const scanTemplateStateUntil = function(state, re) {
  const template = state.template;
  const tail = template.substring(state.current);
  const length = tail.length;
  const idx = tail.search(re);

  let match = "";

  switch (idx) {
    case -1:
      match = tail;
      break;
    case 0:
      match = '';
      break;
    default:
      match = tail.substring(0, idx);
  }

  state.current += match.length;

  return match;
}

const scanTemplateStateForWhitespace = function(state) {
  const template = state.template;
  let char = template[state.current];
  while(whitespaceRE.test(char)) {
    char = template[++state.current];
  }
}
