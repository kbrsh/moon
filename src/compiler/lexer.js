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
  var startChar = input.charAt(state.currrent);
  state.tokens.push({
    type: "tagStart",
    close: isClosingStart
  });
  state.current += isClosingStart ? 2 : 1;

  lexTagContents(state);

  var isClosingEnd = input.charAt(state.current + 1) === ">";
  var endChar = input.charAt(state.current);
  state.tokens.push({
    type: "tagEnd",
    close: isClosingEnd
  });
  state.current += isClosingEnd ? 2 : 1;
}

var lexTagContents = function(state) {
  var input = state.input;
  var len = input.length;
  var tagName = "";

  while(state.current < len) {
    var char = input.charAt(state.current);
    var next = input.charAt(state.current + 1);
    if((char === "/" && next === ">") || (char === ">") || (char === " ")) {
      break;
    }
    tagName += char;
    state.current++;
  }

  state.tokens.push({
    type: "tag",
    value: tagName
  });

  lexAttributes(state);
}

var lexAttributes = function(state) {
  var input = state.input;
  var len = input.length;
  while(state.current < len) {
    var char = input.charAt(state.current);
    var next = input.charAt(state.current + 1);
    if((char === "/" && next === ">") || (char === ">")) {
      break;
    }
    state.current++;
  }
}
