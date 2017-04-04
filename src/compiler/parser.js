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
  let nextToken = state.tokens[state.current + 1];

  const increment = function(num) {
    state.current += num === undefined ? 1 : num;
    token = state.tokens[state.current];
    previousToken = state.tokens[state.current - 1];
    nextToken = state.tokens[state.current + 1];
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
  if(token.type === "tag") {
    const tagType = token.value;
    let node = createParseNode(tagType, token.attributes, []);

    increment();

    // If it is an svg element, let code generator know
    if(SVG_ELEMENTS.indexOf(tagType) !== -1) {
      node.isSVG = true;
    }

    // If it's self closing, return it here
    if(HTML_ELEMENTS.indexOf(tagType) !== -1) {
      return node;
    }

    if(token) {
      while((token.type !== "tag") || ((token.type === "tag") && (!token.close || token.value !== tagType))) {
        var parsedChildState = walk(state);
        if(parsedChildState) {
          node.children.push(parsedChildState);
        }
        increment(0);
        if(!token) {
          // No token means a tag was left unclosed
          if("__ENV__" !== "production") {
            error(`The element "${node.type}" was left unclosed.`);
          }
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
