import { parseTemplate } from "./template";
import { pushChild } from "./util";

export const parseExpression = (index, input, length, stack, dependencies, locals) => {
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
    index: stack.parseIndex++,
    type: "m-expression",
    content: expression,
    dynamic: parseTemplate(expression, dependencies, locals)
  }, stack);

  return index;
};
