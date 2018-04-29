import { escapeRE, escapeMap, pushChild } from "./util";

export const parseText = (index, input, length, stack) => {
  let content = "";

  for (; index < length; index++) {
    const char = input[index];

    if (char === "<" || char === "{") {
      break;
    } else {
      content += char;
    }
  }

  pushChild({
    index: stack.parseIndex++,
    type: "m-text",
    content: content.replace(escapeRE, (match) => escapeMap[match])
  }, stack);

  return index;
};
