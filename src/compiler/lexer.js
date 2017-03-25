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
  const endOfText = input.indexOf("<", state.current);
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
  state.tokens.push({
    type: "tagStart",
    close: isClosingStart
  });
  state.current += isClosingStart ? 2 : 1;

  // Lex type and attributes
  const tagType = lexTagType(state);
  lexAttributes(state);

  // Lex ending tag
  const isClosingEnd = input.charAt(state.current) === "/";
  state.tokens.push({
    type: "tagEnd",
    close: false
  });
  state.current += isClosingEnd ? 2 : 1;
  if(isClosingEnd) {
    state.tokens.push({
      type: "tagStart",
      close: true
    });
    state.tokens.push({
      type: "tag",
      value: tagType
    });
    state.tokens.push({
      type: "attribute",
      value: {}
    });
    state.tokens.push({
      type: "tagEnd",
      close: false
    });
  }
}

const lexTagType = function(state) {
  const input = state.input;
  const len = input.length;
  let start = state.current;
  while(start < len) {
    var char = input.charAt(start);
    if((char === "/") || (char === ">") || (char === " ")) {
      start++;
    } else {
      break;
    }
  }

  let end = start;
  while(end < len) {
    var char = input.charAt(end);
    if((char === "/") || (char === ">") || (char === " ")) {
      break;
    } else {
      end++;
    }
  }

  const tagType = input.slice(start, end);
  state.tokens.push({
    type: "tag",
    value: tagType
  });
  state.current = end;
  return tagType;
}

const lexAttributes = function(state) {
  const input = state.input;
  const len = input.length;
  let end = state.current;

  let attrs = {};

  let char = input.charAt(end);
  let nextChar = input.charAt(end + 1);

  const incrementChar = function() {
    end++;
    char = input.charAt(end);
    nextChar = input.charAt(end + 1);
  }

  while(end < len) {
    // Reached the end of the tag
    if((char === ">") || (char === "/" && nextChar === ">")) {
      break;
    }

    // Reached end of an attribute
    if(char === " ") {
      incrementChar();
      continue;
    }

    // Begin obtaining the attribute name
    let attrName = "";
    let noValue = false;
    while(char !== "=" && end < len) {
      // Ensure attribute has a value
      if((char !== " ") && (char !== ">") || (char === "/" && nextChar !== ">")) {
        attrName += char;
      } else {
        // Attribute had no value, skip it
        noValue = true;
        break;
      }
      incrementChar();
    }

    let attrValue = {
      name: attrName,
      value: "",
      meta: {}
    };

    if(noValue) {
      attrs[attrName] = attrValue;
      continue;
    }

    let quoteType = " ";

    // Exit equal sign and setup quote type
    incrementChar();
    if(char === "'" || char === "\"") {
      quoteType = char;
      incrementChar();
    } else {
      attrValue.value += char;
    }

    while(((char !== quoteType) && (char !== ">") || (char === "/" && nextChar !== ">")) && (end < len)) {
      attrValue.value += char;
      incrementChar();
    }

    if(attrName.indexOf(":") !== -1) {
      const attrNames = attrName.split(":");
      attrValue.name = attrNames[0];
      attrValue.meta.arg = attrNames[1];
    }

    attrs[attrName] = attrValue;
    incrementChar();
  }

  state.current = end;
  state.tokens.push({
    type: "attribute",
    value: attrs
  });
}
