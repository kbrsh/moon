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
    const child = parseWalk(state);
    if(child) {
      root.children.push(child);
    }
  }

  return root;
}

const HTML_ELEMENTS = ["address", "article", "aside", "footer", "header", "h1", "h2", "h3", "h4", "h5", "h6", "hgroup", "nav", "section", "div", "dd", "dl", "dt", "figcaption", "figure", "picture", "li", "main", "ol", "p", "pre", "ul", "a", "b", "abbr", "bdi", "bdo", "cite", "code", "data", "dfn", "em", "i", "kbd", "mark", "q", "rp", "rt", "rtc", "ruby", "s", "samp", "small", "span", "strong", "sub", "sup", "time", "u", "var", "audio", "map", "video", "object", "canvas", "del", "ins", "caption", "col", "colgroup", "table", "thead", "tbody", "td", "th", "tr", "button", "datalist", "fieldset", "form", "label", "legend", "meter", "optgroup", "option", "output", "progress", "select", "textarea", "details", "dialog", "menu", "menuitem", "summary", "content", "element", "shadow", "template", "blockquote", "iframe", "tfoot"];
const VOID_ELEMENTS = ["area", "base", "br", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
const SVG_ELEMENTS = ["svg", "animate", "circle", "clippath", "cursor", "defs", "desc", "ellipse", "filter", "font-face", "foreignObject", "g", "glyph", "image", "line", "marker", "mask", "missing-glyph", "path", "pattern", "polygon", "polyline", "rect", "switch", "symbol", "text", "textpath", "tspan", "use", "view"];

const createParseNode = function(type, props, children) {
  return {
    type: type,
    props: props,
    children: children
  }
}

const parseWalk = function(state) {
  let token = state.tokens[state.current];
  let previousToken = state.tokens[state.current - 1];

  const move = function(num) {
    state.current += num === undefined ? 1 : num;
    token = state.tokens[state.current];
    previousToken = state.tokens[state.current - 1];
  }

  if(token.type === "text") {
    move();
    return previousToken.value;
  }

  if(token.type === "comment") {
    move();
    return null;
  }

  // Start of new Tag
  if(token.type === "tag") {
    const tagType = token.value;
    const closeStart = token.closeStart;
    const closeEnd = token.closeEnd;

    const isSVGElement = SVG_ELEMENTS.indexOf(tagType) !== -1;
    const isVoidElement = VOID_ELEMENTS.indexOf(tagType) !== -1 || closeEnd === true;

    let node = createParseNode(tagType, token.attributes, []);

    move();

    // If it is an svg element, let code generator know
    if(isSVGElement === true) {
      node.isSVG = true;
    }

    if(isVoidElement === true) {
      // Self closing, don't process further
      return node;
    } else if(closeStart === true) {
      // Unmatched closing tag on non void element
      if("__ENV__" !== "production") {
        error(`Could not locate opening tag for the element "${node.type}"`);
      }
      return null;
    } else if(token !== undefined) {
      // Check for custom tag
      if(HTML_ELEMENTS.indexOf(tagType) === -1) {
        node.custom = true;
      }

      // Match all children
      while((token.type !== "tag") || ((token.type === "tag") && ((token.closeStart === undefined && token.closeEnd === undefined) || (token.value !== tagType)))) {
        const parsedChildState = parseWalk(state);
        if(parsedChildState !== null) {
          node.children.push(parsedChildState);
        }

        move(0);

        if(token === undefined) {
          // No token means a tag was left unclosed
          if("__ENV__" !== "production") {
            error(`The element "${node.type}" was left unclosed`);
          }
          break;
        }
      }

      move();
    }

    return node;
  }

  move();
  return;
}
