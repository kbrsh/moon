import { expressionRE, pushChild } from "./util";

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

  let info;
  while ((info = expressionRE.exec(expression)) !== null) {
    let name = info[1];
    if (name !== undefined && locals.indexOf(name) === -1) {
      dependencies.push(name);
    }
  }

  pushChild({
    index: stack.parseIndex++,
    type: "m-expression",
    content: expression
  }, stack);

  return index;
};
