const tagStartRE = /<[\w/]\s*/;

const lex = function(input) {
  let state = {
    input: input,
    current: 0,
    tokens: []
  }
  lexState(state);
  return state.tokens;
}

const lexState = function(state) {
  const input = state.input;
  const len = input.length;
  while(state.current < len) {
    // Check if it is text
    if(input.charAt(state.current) !== "<") {
      lexText(state);
      continue;
    }

    // Check if it is a comment
    if(input.substr(state.current, 4) === "<!--") {
      lexComment(state);
      continue;
    }

    // It's a tag
    lexTag(state);
  }
}

const lexText = function(state) {
  const input = state.input;
  const len = input.length;
  const endOfText = input.substring(state.current).search(tagStartRE) + state.current;

  // Only Text
  if(endOfText === -1) {
    state.tokens.push({
      type: "text",
      value: input.slice(state.current)
    });
    state.current = len;
    return;
  }

  // No Text at All
  if(endOfText === state.current) {
    return;
  }

  // End of Text Found
  state.tokens.push({
    type: "text",
    value: input.slice(state.current, endOfText)
  });
  state.current = endOfText;
}

const lexComment = function(state) {
  const input = state.input;
  const len = input.length;
  state.current += 4;
  const endOfComment = input.indexOf("-->", state.current);

  // Only an unclosed comment
  if(endOfComment === -1) {
    state.tokens.push({
      type: "comment",
      value: input.slice(state.current)
    });
    state.current = len;
    return;
  }

  // End of Comment Found
  state.tokens.push({
    type: "comment",
    value: input.slice(state.current, endOfComment)
  });
  state.current = endOfComment + 3;
}

const lexTag = function(state) {
  const input = state.input;
  const len = input.length;

  // Lex Starting of Tag
  const isClosingStart = input.charAt(state.current + 1) === "/";
  state.current += isClosingStart ? 2 : 1;

  // Lex type and attributes
  let tagToken = lexTagType(state);
  lexAttributes(tagToken, state);

  // Lex ending tag
  const isClosingEnd = input.charAt(state.current) === "/";
  state.current += isClosingEnd ? 2 : 1;

  // Check if Closing Start
  if(isClosingStart) {
    tagToken.closeStart = true;
  }

  // Check if Closing End
  if(isClosingEnd) {
    tagToken.closeEnd = true;
  }
}

const lexTagType = function(state) {
  const input = state.input;
  const len = input.length;
  let current = state.current;
  let tagType = "";
  while(current < len) {
    const char = input.charAt(current);
    if((char === "/") || (char === ">") || (char === " ")) {
      break;
    } else {
      tagType += char;
    }
    current++;
  }

  const tagToken = {
    type: "tag",
    value: tagType
  };

  state.tokens.push(tagToken);

  state.current = current;
  return tagToken;
}

const lexAttributes = function(tagToken, state) {
  const input = state.input;
  const len = input.length;
  let current = state.current;
  let char = input.charAt(current);
  let nextChar = input.charAt(current + 1);

  const incrementChar = function() {
    current++;
    char = input.charAt(current);
    nextChar = input.charAt(current + 1);
  }

  let attributes = {};

  while(current < len) {
    // If it is the end of a tag, exit
    if((char === ">") || (char === "/" && nextChar === ">")) {
      break;
    }

    // If there is a space, the attribute ended
    if(char === " ") {
      incrementChar();
      continue;
    }

    // Get the name of the attribute
    let attrName = "";
    let noValue = false;

    while(current < len && char !== "=") {
      if((char !== " ") && (char !== ">") && (char !== "/" && nextChar !== ">")) {
        attrName += char;
      } else {
        noValue = true;
        break;
      }
      incrementChar();
    }

    let attrValue = {
      name: attrName,
      value: "",
      meta: {}
    }

    if(noValue) {
      attributes[attrName] = attrValue;
      continue;
    }

    // Exit Equal Sign
    incrementChar();

    // Get the type of quote used
    let quoteType = " ";
    if(char === "'" || char === "\"") {
      quoteType = char;

      // Exit the quote
      incrementChar();
    }

    // Find the end of it
    while(current < len && char !== quoteType) {
      attrValue.value += char;
      incrementChar();
    }

    // Exit the end of it
    incrementChar();

    // Check for an Argument
    const argIndex = attrName.indexOf(":");
    if(argIndex !== -1) {
      const splitAttrName = attrName.split(":");
      attrValue.name = splitAttrName[0];
      attrValue.meta.arg = splitAttrName[1];
    }

    // Setup the Value
    attributes[attrName] = attrValue;
  }

  state.current = current;
  tagToken.attributes = attributes;
}
