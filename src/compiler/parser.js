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

var HTML_ELEMENTS = {
  "html": true,
  "body": true,
  "base": false,
  "head": true,
  "link": false,
  "meta": false,
  "style": true,
  "title": true,
  "address": true,
  "article": true,
  "aside": true,
  "footer": true,
  "header": true,
  "h1": true,
  "h2": true,
  "h3": true,
  "h4": true,
  "h5": true,
  "h6": true,
  "hgroup": true,
  "nav": true,
  "section": true,
  "div": true,
  "dd": true,
  "dl": true,
  "dt": true,
  "figcaption": true,
  "figure": true,
  "hr": false,
  "img": false,
  "li": true,
  "main": true,
  "ol": true,
  "p": true,
  "pre": true,
  "ul": true,
  "a": true,
  "b": true,
  "abbr": true,
  "bdi": true,
  "bdo": true,
  "br": false,
  "cite": true,
  "code": true,
  "data": true,
  "dfn": true,
  "em": true,
  "i": true,
  "kbd": true,
  "mark": true,
  "q": true,
  "rp": true,
  "rt": true,
  "rtc": true,
  "ruby": true,
  "s": true,
  "samp": true,
  "small": true,
  "span": true,
  "strong": true,
  "sub": true,
  "sup": true,
  "time": true,
  "u": true,
  "var": true,
  "wbr": false,
  "area": false,
  "audio": true,
  "map": true,
  "track": false,
  "video": true,
  "embed": false,
  "object": true,
  "param": false,
  "source": false,
  "canvas": true,
  "script": true,
  "noscript": true,
  "del": true,
  "ins": true,
  "caption": true,
  "col": false,
  "colgroup": true,
  "table": true,
  "thead": true,
  "tbody": true,
  "td": true,
  "th": true,
  "tr": true,
  "button": true,
  "datalist": true,
  "fieldset": true,
  "form": true,
  "input": false,
  "label": true,
  "legend": true,
  "meter": true,
  "optgroup": true,
  "option": true,
  "output": true,
  "progress": true,
  "select": true,
  "textarea": true,
  "details": true,
  "dialog": true,
  "menu": true,
  "menuitem": true,
  "summary": true,
  "content": true,
  "element": true,
  "shadow": true,
  "template": true
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
  if(token.type === "tagStart" && !token.close && !fourthToken.close) {
    var node = createParseNode(secondToken.value, thirdToken.value, []);
    var tagType = secondToken.value;
    // Exit Start Tag
    increment(4);
    var startContentIndex = state.current;
    // Make sure it has content and is closed
    if(token) {
      if(!HTML_ELEMENTS[node.type]) {
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
