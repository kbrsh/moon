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

  return root;
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
  var fourthToken = state.tokens[state.current + 3]

  if(token.type === "text") {
    state.current++;
    return createParseNode("#text", {}, [token.value]);
  }
  if(token.type === "tagStart" && !token.close && !fourthToken.close) {

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
