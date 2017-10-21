const compileTemplateExpression = function(expression, state) {
  const dependencies = state.dependencies;
  let props = dependencies.props;
  let methods = dependencies.methods;

  const exclude = state.exclude;
  const locals = state.locals;

  let dynamic = false;
  let info;

  while((info = expressionRE.exec(expression)) !== null) {
    let match = info[0];
    let name = info[1];
    if(name !== undefined && exclude.indexOf(name) === -1) {
      if(match[match.length - 1] === "(") {
        if(methods.indexOf(name) === -1) {
          methods.push(name);
        }
      } else {
        if(locals.indexOf(name) === -1 && props.indexOf(name) === -1) {
          props.push(name);
        }

        dynamic = true;
      }
    }
  }

  return dynamic;
}

const compileTemplate = function(template, state) {
  const length = template.length;
  let current = 0;
  let dynamic = false;
  let output = '';

  if(length === 0) {
    output = "\"\"";
  } else {
    while(current < length) {
      // Match text
      const textTail = template.substring(current);
      const textMatch = textTail.match(openRE);

      if(textMatch === null) {
        // Only static text
        output += `"${textTail}"`;
        break;
      }

      const textIndex = textMatch.index;
      if(textIndex !== 0) {
        // Add static text and move to template expression
        output += `"${textTail.substring(0, textIndex)}"`;
        current += textIndex;
      }

      // Mark as dynamic
      dynamic = true;

      // Concatenate if not at the start
      if(current !== 0) {
        output += concatenationSymbol;
      }

      // Exit opening delimiter
      current += textMatch[0].length;

      // Get expression, and exit closing delimiter
      const expressionTail = template.substring(current);
      const expressionMatch = expressionTail.match(closeRE);

      if("__ENV__" !== "production" && expressionMatch === null) {
        error(`Expected closing delimiter after "${expressionTail}"`);
      } else {
        // Add expression
        const expressionIndex = expressionMatch.index;
        const expression = expressionTail.substring(0, expressionIndex);
        compileTemplateExpression(expression, state);
        output += `(${expression})`;
        current += expression.length + expressionMatch[0].length;

        // Concatenate if not at the end
        if(current !== length) {
          output += concatenationSymbol;
        }
      }
    }
  }

  return {
    output: output,
    dynamic: dynamic
  };
}
