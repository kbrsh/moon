import { error, pushChild } from "./util";

export const parseOpeningTag = (index, input, length, stack) => {
  let type = "";

  for (; index < length; index++) {
    const char = input[index];

    if (char === ">") {
      const element = {
        index: stack.parseIndex++,
        type: type,
        children: []
      };

      pushChild(element, stack);
      stack.push(element);

      index += 1;
      break;
    } else if (char === "/" && input[index + 1] === ">") {
      pushChild({
        index: stack.parseIndex++,
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

export const parseClosingTag = (index, input, length, stack) => {
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
