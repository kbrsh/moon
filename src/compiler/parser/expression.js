import { parseTemplate } from "./template";

export const parseExpression = (index, input, length, stack, dependencies) => {
  let expression = "";

  for (; index < length; index++) {
    const char = input[index];

    if (char === "}") {
      index += 1;
      break;
    } else {
      expression += char;
    }
  }

  stack[stack.length - 1].children.push({
    type: "#text",
    attributes: [{
      key: "",
      value: expression,
      expression: true,
      dynamic: parseTemplate(expression, dependencies)
    }],
    children: []
  });

  return index;
};
