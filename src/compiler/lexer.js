var lex = function(input) {
  var state = {
    input: input,
    current: 0,
    tokens: []
  }
  lexState(state);
  return state.tokens;
}

var lexState = function(state) {
  var input = state.input;
  var len = input.length;
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

var lexText = function(state) {
  var input = state.input;
  var len = input.length;
  var endOfText = input.indexOf("<", state.current);
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

var lexComment = function(state) {
  var input = state.input;
  var len = input.length;
  state.current += 4;
  var endOfComment = input.indexOf("-->", state.current);

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

var lexTag = function(state) {
  var input = state.input;
  var len = input.length;

  // Lex Starting of Tag
  var isClosingStart = input.charAt(state.current + 1) === "/";
  state.tokens.push({
    type: "tagStart",
    close: isClosingStart
  });
  state.current += isClosingStart ? 2 : 1;

  // Lex type and attributes
  var tagType = lexTagType(state);
  lexAttributes(state);

  // Lex ending tag
  var isClosingEnd = input.charAt(state.current) === "/";
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

var lexTagType = function(state) {
  var input = state.input;
  var len = input.length;
  var start = state.current;
  while(start < len) {
    var char = input.charAt(start);
    if((char === "/") || (char === ">") || (char === " ")) {
      start++;
    } else {
      break;
    }
  }

  var end = start;
  while(end < len) {
    var char = input.charAt(end);
    if((char === "/") || (char === ">") || (char === " ")) {
      break;
    } else {
      end++;
    }
  }

  var tagType = input.slice(start, end);
  state.tokens.push({
    type: "tag",
    value: tagType
  });
  state.current = end;
  return tagType;
}

var lexAttributes = function(state) {
  var input = state.input;
  var len = input.length;
  var end = state.current;

  var attrs = {};

  // Captures attributes
  var ATTRIBUTE_RE = /([^=\s]*)(=?)("[^"]*"|[^\s"]*)/gi

  var char = input.charAt(end);
  var nextChar = input.charAt(end + 1);

  var incrementChar = function() {
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
    var attrName = "";
    var noValue = false;
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

    if(noValue) {
      attrs[attrName] = "";
      continue;
    }

    var attrValue = "";
    var quoteType = " ";

    // Exit equal sign and setup quote type
    incrementChar();
    if(char === "'" || char === "\"") {
      quoteType = char;
      incrementChar();
    } else {
      attrValue += char;
    }

    while(((char !== quoteType) && (char !== ">") || (char === "/" && nextChar !== ">")) && (end < len)) {
      attrValue += char;
      incrementChar();
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
