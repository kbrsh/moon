import { parseComment } from "./comment";
import { parseOpeningTag, parseClosingTag } from "./tag";
import { parseText } from "./text";
import { parseExpression } from "./expression";

export const parse = (input) => {
  const length = input.length;
  let dependencies = [];

  const root = {
    index: 0,
    nextIndex: 1,
    type: "#root",
    attributes: [],
    children: [],
    dependencies: dependencies
  };

  let stack = [root];

  for (let i = 0; i < length;) {
    const char = input[i];

    if (char === "<") {
      if (input[i + 1] === "!" && input[i + 2] === "-" && input[i + 3] === "-") {
        i = parseComment(i + 4, input, length);
      } else if (input[i + 1] === "/") {
        i = parseClosingTag(i + 2, input, length, stack);
      } else {
        i = parseOpeningTag(i + 1, input, length, stack, dependencies);
      }
    } else if (char === "{") {
      i = parseExpression(i + 1, input, length, stack, dependencies);
    } else {
      i = parseText(i, input, length, stack);
    }
  }

  return root;
};
