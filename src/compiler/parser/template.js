const expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)/g;

export const parseTemplate = (expression, dependencies, locals) => {
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
