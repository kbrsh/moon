import { whitespaceRE, pushChild } from "./util";

const escapeRE = /(?:(?:&(?:amp|gt|lt|nbsp|quot);)|"|\\|\n)/g;
const escapeMap = {
  "&amp;": '&',
  "&gt;": '>',
  "&lt;": '<',
  "&nbsp;": ' ',
  "&quot;": "\\\"",
  '\\': "\\\\",
  '"': "\\\"",
  '\n': "\\n"
};

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

  if (!whitespaceRE.test(content)) {
    pushChild({
      index: stack[0].index++,
      type: "m-text",
      content: content.replace(escapeRE, (match) => escapeMap[match])
    }, stack);
  }

  return index;
};
