var parse = function(tokens) {
  var root = {
    type: "ROOT",
    props: {},
    children: []
  }
  var state = {
    tokens: tokens,
    current: 0,
    stack: [root],
  }
  parseState(state);
  return root.children;
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
  var nodes = state.stack[state.stack.length - 1].children;
  var collectedTokens = [];
  var parentTag;
  while(state.current < len) {
    var token = state.tokens[state.current];
    var nextToken = state.tokens[state.current + 1];
    var fourthToken = state.tokens[state.current + 3];

    // Check for opening tag
    if(token.type === "tagStart" && !token.close && !fourthToken.close) {
      state.current++;
      var tagToken = state.tokens[state.current];
      parentTag = tagToken.value;
      state.current++;
      var attributeToken = state.tokens[state.current];
      nodes.push(createParseNode(tagToken.value, attributeToken.value, []));
      state.current += 2;
      continue;
    }

    // Check for closing tag
    if(token.type === "tagStart" && nextToken.value === parentTag && (token.close || fourthToken.close)) {
      state.current++;
      var tagToken = state.tokens[state.current];

      var childState = {
        tokens: collectedTokens,
        current: 0,
        stack: nodes
      }

      parseState(childState)
      console.log(childState)
      //state.stack.children.push(childState.stack);
      continue;
    }
    collectedTokens.push(token);
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
