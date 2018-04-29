export { error } from "../../util/util";

export const expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)/g;
export const escapeRE = /(?:(?:&(?:amp|gt|lt|nbsp|quot);)|"|\\|\n)/g;
export const escapeMap = {
  "&amp;": '&',
  "&gt;": '>',
  "&lt;": '<',
  "&nbsp;": ' ',
  "&quot;": "\\\"",
  '\\': "\\\\",
  '"': "\\\"",
  '\n': "\\n"
};

export const pushChild = (child, stack) => {
  stack[stack.length - 1].children.push(child);
};
