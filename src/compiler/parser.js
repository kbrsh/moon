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

  return root;
}

var HTML_ELEMENTS = mapArray(["html","body","head","style","title","address","article","aside","footer","header","h1","h2","h3","h4","h5","h6","hgroup","nav","section","div","dd","dl","dt","figcaption","figure","li","main","ol","p","pre","ul","a","b","abbr","bdi","bdo","cite","code","data","dfn","em","i","kbd","mark","q","rp","rt","rtc","ruby","s","samp","small","span","strong","sub","sup","time","u","var","audio","map","video","object","canvas","script","noscript","del","ins","caption","colgroup","table","thead","tbody","td","th","tr","button","datalist","fieldset","form","label","legend","meter","optgroup","option","output","progress","select","textarea","details","dialog","menu","menuitem","summary","content","element","shadow","template"]);

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
  if(token.type === "tagStart" && !token.close && !fourthToken.close) {
    var node = createParseNode(secondToken.value, thirdToken.value, []);
    var tagType = secondToken.value;
    // Exit Start Tag
    increment(4);
    var startContentIndex = state.current;
    // Make sure it has content and is closed
    if(token) {
      if(!HTML_ELEMENTS(node.type)) {
        return node;
      }
      // Find Closing Tag, and push children recursively
      while((token.type !== "tagStart") || (token.type === "tagStart" && !(token.close))) {
        // Push a parsed child to the current node
        var parsedChildState = walk(state);
        if(parsedChildState) {
          node.children.push(parsedChildState);
        }
        increment(0);
        if(!token) {
          // No token means that there is nothing left to parse in this element
          // This usually means that the tag was unclosed
          break;
        }
      }
      increment();
    }

    return node;
  }

  increment();
  return;
}
