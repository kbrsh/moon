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
  var rawAttrs = "";

  // Captures attributes
  var ATTRIBUTE_RE = /([^=\s]*)(=?)("[^"]*"|[^\s"]*)/gi

  while(end < len) {
    var char = input.charAt(end);
    var nextChar = input.charAt(end + 1);
    if((char === ">") || (char === "/" && nextChar === ">")) {
      break;
    }
    rawAttrs += char;
    end++;
  }

  rawAttrs.replace(ATTRIBUTE_RE, function(match, key, equal, value) {
    var firstChar = value[0];
    var lastChar = value[value.length - 1];
    // Quotes were included in the value
    if((firstChar === "'" && lastChar === "'") || (firstChar === "\"" && lastChar === "\"")) {
      value = value.slice(1, -1);
    }

    // If there is no value provided
    if(!value) {
      value = key
    }
    // Set attribute value
    if(key && value) {
      attrs[key] = value;
    }
  });

  state.current = end;
  state.tokens.push({
    type: "attribute",
    value: attrs
  });
}
