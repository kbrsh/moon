const tagOrCommentStartRE = /<\/?(?:[A-Za-z]+\w*)|<!--/;

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
  const current = state.current;
  const input = state.input;
  const len = input.length;

  let endOfText = input.substring(current).search(tagOrCommentStartRE);

  if(endOfText === -1) {
    // Only Text
    state.tokens.push({
      type: "text",
      value: input.slice(current)
    });
    state.current = len;
    return;
  } else if(endOfText !== 0) {
    // End of Text Found
    endOfText += current;
    state.tokens.push({
      type: "text",
      value: input.slice(current, endOfText)
    });
    state.current = endOfText;
  }
}

const lexComment = function(state) {
  let current = state.current;
  const input = state.input;
  const len = input.length;

  current += 4;

  const endOfComment = input.indexOf("-->", current);

  if(endOfComment === -1) {
    // Only an unclosed comment
    state.tokens.push({
      type: "comment",
      value: input.slice(current)
    });
    state.current = len;
  } else {
    // End of Comment Found
    state.tokens.push({
      type: "comment",
      value: input.slice(current, endOfComment)
    });
    state.current = endOfComment + 3;
  }
}

const lexTag = function(state) {
  const input = state.input;
  const len = input.length;

  // Lex Starting of Tag
  const isClosingStart = input.charAt(state.current + 1) === "/";
  state.current += isClosingStart === true ? 2 : 1;

  // Lex type and attributes
  let tagToken = lexTagType(state);
  lexAttributes(tagToken, state);

  // Lex ending tag
  const isClosingEnd = input.charAt(state.current) === "/";
  state.current += isClosingEnd === true ? 2 : 1;

  // Check if Closing Start
  if(isClosingStart === true) {
    tagToken.closeStart = true;
  }

  // Check if Closing End
  if(isClosingEnd === true) {
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

    // If there is a space, skip
    if(char === " ") {
      incrementChar();
      continue;
    }

    // Get the name of the attribute
    let attrName = "";
    let noValue = false;

    while(current < len && char !== "=") {
      if((char === " ") || (char === ">") || (char === "/" && nextChar === ">")) {
        noValue = true;
        break;
      } else {
        attrName += char;
      }
      incrementChar();
    }

    let attrValue = {
      name: attrName,
      value: "",
      meta: {}
    }

    if(noValue === true) {
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
