const expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)/g;
const locals = ["NaN", "event", "false", "in", "m", "null", "this", "true", "typeof", "undefined"];

export const parseTemplate = (expression, dependencies) => {
  let info, dynamic = false;

  while ((info = expressionRE.exec(expression)) !== null) {
    let name = info[1];
    if (name !== undefined && locals.indexOf(name) === -1) {
      dependencies.push(name);
      dynamic = true;
    }
  }

  return dynamic;
};
