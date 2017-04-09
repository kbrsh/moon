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

const HTML_ELEMENTS = ["html","body","head","style","title","address","article","aside","footer","header","h1","h2","h3","h4","h5","h6","hgroup","nav","section","div","dd","dl","dt","figcaption","figure","li","main","ol","p","pre","ul","a","b","abbr","bdi","bdo","cite","code","data","dfn","em","i","kbd","mark","q","rp","rt","rtc","ruby","s","samp","small","span","strong","sub","sup","time","u","var","audio","map","video","object","canvas","script","noscript","del","ins","caption","colgroup","table","thead","tbody","td","th","tr","button","datalist","fieldset","form","label","legend","meter","optgroup","option","output","progress","select","textarea","details","dialog","menu","menuitem","summary","content","element","shadow","template"];
const VOID_ELEMENTS = ["area","base","br","command","embed","hr","img","input","keygen","link","meta","param","source","track","wbr"];
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
    return null;
  }

  // Start of new Tag
  if(token.type === "tag") {
    const tagType = token.value;
    const close = token.close;

    const isSVGElement = SVG_ELEMENTS.indexOf(tagType) !== -1;
    const isVoidElement = VOID_ELEMENTS.indexOf(tagType) !== -1;
    const isCustomVoidElement = HTML_ELEMENTS.indexOf(tagType) === -1;

    let node = createParseNode(tagType, token.attributes, []);

    increment();

    // If it is an svg element, let code generator know
    if(isSVGElement) {
      node.isSVG = true;
    }

    if((isVoidElement) || (isCustomVoidElement && close === true)) {
      // Self closing, don't process further
      return node;
    } else if(close === true) {
      // Unmatched closing tag on non void element
      return null;
    } else if(token !== undefined) {
      // Match all children
      const current = state.current;
      while((token.type !== "tag") || ((token.type === "tag") && (token.close === false || token.value !== tagType))) {
        var parsedChildState = walk(state);
        if(parsedChildState !== null) {
          node.children.push(parsedChildState);
        }
        increment(0);
        if(token === undefined) {
          // No token means a tag was most likely left unclosed

          if(isCustomVoidElement) {
            // Is a void custom element, empty children
            increment(-(state.current - current + 1));
            node.children = [];
          } else if("__ENV__" !== "production") {
            // Non void element left unclosed
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
