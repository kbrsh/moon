import { parseTemplate } from "./template";
import { pushChild } from "./util";

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

  pushChild({
    index: stack[0].nextIndex++,
    type: "#text",
    attributes: [{
      key: "",
      value: expression,
      expression: true,
      dynamic: parseTemplate(expression, dependencies)
    }],
    children: []
  }, stack);

  return index;
};
