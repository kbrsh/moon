const expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)/g;
const locals = ["NaN", "event", "false", "in", "m", "null", "this", "true", "typeof", "undefined"];

export const parseTemplate = (expression, dependencies) => {
  let dynamic = false;

  expression = expression.replace(expressionRE, function(match, name) {
    if (name === undefined || locals.indexOf(name) !== -1 || name[0] === "$") {
      return match;
    } else {
      dynamic = true;

      if (dependencies.indexOf(name) === -1) {
        dependencies.push(name);
      }

      return `data.${name}`;
    }
  });

  return {
    expression: expression,
    dynamic: dynamic
  };
};
