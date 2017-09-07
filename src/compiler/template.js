const compileTemplateExpression = function(expression, exclude, dependencies) {
  let dynamic = false;
  let references;

  while((references = expressionRE.exec(expression)) !== null) {
    let reference = references[1];
    if(reference !== undefined && dependencies.indexOf(reference) === -1) {
      if(exclude.indexOf(reference) === -1) {
        dependencies.push(reference);
      }
      dynamic = true;
    }
  }

  return dynamic;
}

const compileTemplate = function(template, exclude, dependencies) {
  const length = template.length;
  let current = 0;
  let output = '';

  while(current < length) {
    // Match text
    const textTail = template.substring(current);
    const textMatch = textTail.match(openRE);

    if(textMatch === null) {
      output += textTail;
      break;
    } else {
      const textIndex = textMatch.index;
      output += textTail.substring(0, textIndex);
      current += textIndex;
    }

    // Exit opening delimiter
    current += textMatch[0].length;

    // Get name, and exit closing delimiter
    const nameTail = template.substring(current);
    const nameMatch = nameTail.match(closeRE);

    if("__ENV__" !== "production" && nameMatch === null) {
      error(`Expected closing delimiter after "${nameTail}"`);
    } else {
      const nameIndex = nameMatch.index;
      const name = nameTail.substring(0, nameIndex);
      compileTemplateExpression(name, exclude, dependencies);
      output += `" + (${name}) + "`;
      current += name.length + nameMatch[0].length;
    }
  }

  return output;
}
