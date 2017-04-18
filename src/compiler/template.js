const whitespaceRE = /\s/;
const expressionRE = /"[^"]*"|'[^']*'|\btrue\b|\bfalse\b|\.\w*[a-zA-Z$_]\w*|\w*[a-zA-Z$_]\w*:|(\w*[a-zA-Z$_]\w*)/g;

/**
 * Compiles a Template
 * @param {String} template
 * @param {Array} delimiters
 * @param {Array} escapedDelimiters
 * @param {Boolean} isString
 * @return {String} compiled template
 */
const compileTemplate = function(template, delimiters, escapedDelimiters, isString) {
  let state = {
    current: 0,
    template: template,
    output: "",
    openDelimiterLen: delimiters[0].length,
    closeDelimiterLen: delimiters[1].length,
    openRE: new RegExp(escapedDelimiters[0]),
    closeRE: new RegExp(`\\s*${escapedDelimiters[1]}`)
  };

  compileTemplateState(state, isString);

  return state.output;
}

const compileTemplateState = function(state, isString) {
  const template = state.template;
  const length = template.length;
  while(state.current < length) {
    // Match Text Between Templates
    const value = scanTemplateStateUntil(state, state.openRE);

    if(value) {
      state.output += escapeString(value);
    }

    // If we've reached the end, there are no more templates
    if(state.current === length) {
      break;
    }

    // Exit Opening Delimiter
    state.current += state.openDelimiterLen;

    // Consume whitespace
    scanTemplateStateForWhitespace(state);

    // Get the name of the opening tag
    let name = scanTemplateStateUntil(state, state.closeRE);

    // If we've reached the end, the tag was unclosed
    if(state.current === length) {
      if("__ENV__" !== "production") {
        error(`Expected closing delimiter "}}" after "${name}"`);
      }
      break;
    }

    if(name) {
      // Extract Variable References
      name = "(" + name.replace(expressionRE, function(match, reference) {
        if(reference !== undefined) {
          return `instance.get("${reference}")`;
        } else {
          return match;
        }
      }) + ")";

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
    state.current += state.closeDelimiterLen;
  }
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
