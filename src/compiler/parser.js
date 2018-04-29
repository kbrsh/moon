import { error } from "../util/util";

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

let parseIndex;

const pushChild = (child, stack) => {
  stack[stack.length - 1].children.push(child);
};

const parseComment = (index, input, length, stack) => {
  for (; index < length;) {
    const char0 = input[index];
    const char1 = input[index + 1];
    const char2 = input[index + 2];

    if (char0 === "<" && char1 === "!" && char2 === "-" && input[index + 3] === "-") {
      index = parseComment(index + 4, input, length, stack);
    } else if (char0 === "-" && char1 === "-" && char2 === ">") {
      index += 3;
      break;
    } else {
      index += 1;
    }
  }

  return index;
};

const parseOpeningTag = (index, input, length, stack) => {
  let type = "";

  for (; index < length; index++) {
    const char = input[index];

    if (char === ">") {
      const element = {
        index: parseIndex++,
        type: type,
        children: []
      };

      pushChild(element, stack);
      stack.push(element);

      index += 1;
      break;
    } else if (char === "/" && input[index + 1] === ">") {
      pushChild({
        index: parseIndex++,
        type: type,
        children: []
      }, stack);

      index += 2;
      break;
    } else {
      type += char;
    }
  }

  return index;
};

const parseClosingTag = (index, input, length, stack) => {
  let type = "";

  for(; index < length; index++) {
    const char = input[index];

    if (char === ">") {
      index += 1;
      break;
    } else {
      type += char;
    }
  }

  const lastElement = stack.pop();
  if (type !== lastElement.type && process.env.MOON_ENV === "development") {
    error(`Unclosed tag "${lastElement.type}"`);
  }

  return index;
};

const parseText = (index, input, length, stack) => {
  let content = "";

  for (; index < length; index++) {
    const char = input[index];

    if (char === "<") {
      break;
    } else {
      content += char;
    }
  }

  pushChild({
    index: parseIndex++,
    type: "m-text",
    content: content.replace(escapeRE, (match) => escapeMap[match])
  }, stack);

  return index;
};

export const parse = (input) => {
  const length = input.length;
  parseIndex = 0;

  const root = {
    children: []
  };

  let stack = [root];

  for (let i = 0; i < length;) {
    const char = input[i];

    if (char === "<") {
      if (input[i + 1] === "!" && input[i + 2] === "-" && input[i + 3] === "-") {
        i = parseComment(i + 4, input, length, stack);
      } else if (input[i + 1] === "/") {
        i = parseClosingTag(i + 2, input, length, stack);
      } else {
        i = parseOpeningTag(i + 1, input, length, stack);
      }
    } else {
      i = parseText(i, input, length, stack);
    }
  }

  return root.children;
};
