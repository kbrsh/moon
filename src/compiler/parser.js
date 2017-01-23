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
    root.children.push(walk(state));
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
  var secondToken = state.tokens[state.current + 1];
  var thirdToken = state.tokens[state.current + 2];
  var fourthToken = state.tokens[state.current + 3];

  var increment = function(num) {
    state.current += num || 1;
    token = state.tokens[state.current];
    secondToken = state.tokens[state.current + 1];
    thirdToken = state.tokens[state.current + 2];
    fourthToken = state.tokens[state.current + 3];
  }

  if(token.type === "text") {
    return token.value;
    increment();
  }

  // Start of new Tag
  if(token.type === "tagStart" && !token.close && !fourthToken.close) {
    increment();

    var node = createParseNode(token.value, secondToken.value, []);

    increment(3);
    while(token.type !== 'tagStart' && !token.close && !fourthToken.close) {
      node.children.push(walk(state));
      increment();
    }

    increment(4);
    return node;
  }

  return;
}
