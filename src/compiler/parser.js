const parse = function(tokens) {
  let root = {
    type: "ROOT",
    children: []
  }

  let state = {
    current: 0,
    tokens: tokens
  }

  while(state.current < tokens.length) {
    const child = walk(state);
    if(child) {
      root.children.push(child);
    }
  }

  return root;
}

const HTML_ELEMENTS = ["area","base","br","command","embed","hr","img","input","keygen","link","meta","param","source","track","wbr"];
const SVG_ELEMENTS = ["svg","animate","circle","clippath","cursor","defs","desc","ellipse","filter","font-face","foreignObject","g","glyph","image","line","marker","mask","missing-glyph","path","pattern","polygon","polyline","rect","switch","symbol","text","textpath","tspan","use","view"];

const createParseNode = function(type, props, children) {
  return {
    type: type,
    props: props,
    children: children
  }
}

const walk = function(state) {
  let token = state.tokens[state.current];
  let previousToken = state.tokens[state.current - 1];
  let secondToken = state.tokens[state.current + 1];
  let thirdToken = state.tokens[state.current + 2];
  let fourthToken = state.tokens[state.current + 3];

  const increment = function(num) {
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
    let node = createParseNode(secondToken.value, thirdToken.value, []);
    const tagType = secondToken.value;
    // Exit Start Tag
    increment(4);

    // If it is an svg element, let code generator know
    if(SVG_ELEMENTS.indexOf(node.type) !== -1) {
      node.isSVG = true;
    }

    // If it's self closing, return it here
    if(HTML_ELEMENTS.indexOf(node.type) !== -1) {
      return node;
    }

    const startContentIndex = state.current;
    // Make sure it has content and is closed
    if(token) {
      // Find Closing Tag, and push children recursively
      while((token.type !== "tagStart") || (token.type === "tagStart" && !(token.close))) {
        // Push a parsed child to the current node
        var parsedChildState = walk(state);
        if(parsedChildState) {
          node.children.push(parsedChildState);
        }
        increment(0);
        if(!token) {
          // No token means a tag was left unclosed
          error(`The element "${node.type}" was left unclosed.`);
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
