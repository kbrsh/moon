var parse = function(tokens) {
  var root = {
    type: "ROOT",
    props: {},
    children: []
  }
  var state = {
    tokens: tokens,
    current: 0,
    stack: root,
  }
  parseState(state);
  return root.children[0];
}

var createParseNode = function(type, props, children) {
  return {
    type: type,
    props: props,
    children: children
  }
}

var parseState = function(state) {
  var len = state.tokens.length;

  while(state.current < len) {
    var token = state.tokens[state.current];
    var fourthToken = state.tokens[state.current+3];

    // Check for opening tag
    if(token.type === "tagStart" && !token.close && !fourthToken.close) {
      state.current++;
      var tagToken = state.tokens[state.current];

      state.current++;
      var attributeToken = state.tokens[state.current];
      state.stack.children.push(createParseNode(tagToken.value, attributeToken.value, []));
      continue;
    }

    // Check for closing tag
    if(token.type === "tagStart" && (token.close || fourthToken.close)) {
      state.current++;
      var tagToken = state.tokens[state.current];
      var currentPos = state.current;
      var collectedTokens = [];
      for(state.current; state.current > -1; state.current--) {
        var currentToken = state.tokens[state.current];
        var startCurrentToken = state.tokens[state.current - 1];
        var endCurrentToken = state.tokens[state.current + 2];
        var pendingToken = state.stack.children[state.stack.children.length - 1];
        if(currentToken.type === "tag" && !startCurrentToken.close && !endCurrentToken.close && currentToken.value === pendingToken.type) {
          break;
        }

        collectedTokens.push(currentToken);
      }
      console.log(collectedTokens)
      state.current = currentPos;
    }
    state.current++;
  }
}

console.log(parse([ { type: 'tagStart', close: false },
  { type: 'tag', value: 'h1' },
  { type: 'attribute', value: {} },
  { type: 'tagEnd', close: false },
  { type: 'text', value: '{{msg}}' },
  { type: 'tagStart', close: true },
  { type: 'tag', value: 'h1' },
  { type: 'attribute', value: {} },
  { type: 'tagEnd', close: false } ]));
