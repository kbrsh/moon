const openRE = /\{\{/;
const closeRE = /\s*\}\}/;
const modifierRE = /\[|\.|\(/;
const whitespaceRE = /\s/;

const compileTemplate = function(template, isString) {
  let state = {
    current: 0,
    template: template,
    output: ""
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

    if(value) {
      state.output += value;
    }

    // If we've reached the end, there are no more templates
    if(state.current === length) {
      break;
    }

    // Exit The Opening Tag
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

    if(name) {
      // Extract modifiers
      let modifiers = "";
      let modifierIndex = null;
      if((modifierIndex = (name.search(modifierRE))) !== -1) {
        modifiers = name.substring(modifierIndex);
        name = name.substring(0, modifierIndex);
      }

      // Generate code
      if(isString) {
        state.output += `" + instance.get("${name}")${modifiers} + "`;
      } else {
        state.output += `instance.get("${name}")${modifiers}`;
      }
    }

    // Consume whitespace
    scanTemplateStateForWhitespace(state);

    // Exit mustache
    state.current += 2;
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
