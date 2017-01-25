var parse = function(tokens) {
  var root = {
    type: "ROOT",
    children: []
  }

  var state = {
    current: 0,
    tokens: tokens
  }

  while(state.current < tokens.length) {
    var child = walk(state);
    if(child) {
      root.children.push(child);
    }
  }

  return root.children[0];
}

var createParseNode = function(type, props, children) {
  return {
    type: type,
    props: props,
    children: children
  }
}

var walk = function(state) {
  var token = state.tokens[state.current];
  var previousToken = state.tokens[state.current - 1];
  var secondToken = state.tokens[state.current + 1];
  var thirdToken = state.tokens[state.current + 2];
  var fourthToken = state.tokens[state.current + 3];

  var increment = function(num) {
    state.current += num === undefined ? 1 : num;
    token = state.tokens[state.current];
    previousToken = state.tokens[state.current - 1];
    secondToken = state.tokens[state.current + 1];
    thirdToken = state.tokens[state.current + 2];
  }

  if(token.type === "text") {
    increment();
    return previousToken.value;
  }

  if(token.type === "comment") {
    increment();
    return;
  }

  // Start of new Tag
  if(token.type === "tag" && !previousToken.close && !thirdToken.close) {
    var node = createParseNode(token.value, secondToken.value, []);
    var tagType = token.value;
    // Exit Start Tag
    increment(3);
    var startContentIndex = state.current;
    // Make sure it has content and is closed
    if(token) {
      // Find Closing Tag, and push children recursively
      while((token.type !== "tag") || (token.type === "tag" && token.value !== tagType && (!previousToken.close || !thirdToken.close))) {
        if(token.type === "tagStart" && secondToken.value !== tagType && (token.close || fourthToken.close)) {
          // Tag is a voidElement, empty children, and reset stack to start of content
          state.current = startContentIndex;
          node.children = [];
          increment(0);
          break;
        }
        // Push a child to the current node
        var parsedChildState = walk(state);
        if(parsedChildState) {
          node.children.push(parsedChildState);
        }
        increment(0);
      }
    }

    return node;
  }

  increment();
  return;
}
