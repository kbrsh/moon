const openRE = /\{\{/;
const closeRE = /\}\}/;
const modifierRE = /\[|\.|\(/;

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
    const value = scanTemplateStateUntil(state, openRE);

    if(value) {
      state.output += value;
    }

    state.current += 2;

    let name = scanTemplateStateUntil(state, closeRE);

    if(name) {
      let modifiers = "";
      let modifierIndex = null;
      if((modifierIndex = (name.search(modifierRE))) !== -1) {
        modifiers = name.substring(modifierIndex);
        name = name.substring(0, modifierIndex);
      }

      if(isString) {
        state.output += `" + instance.get("${name}")${modifiers} + "`;
      } else {
        state.output += `instance.get("${name}")${modifiers}`;
      }
    }

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
