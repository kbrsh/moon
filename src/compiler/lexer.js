// Concatenation Symbol
const concatenationSymbol = " + ";

// Opening delimiter
const openRE = /\{\{\s*/;

// Closing delimiter
const closeRE = /\s*\}\}/;

// Whitespace character
const whitespaceCharRE = /[\s\n]/;

// All whitespace
const whitespaceRE = /[\s\n]/g;

// Start of a tag or comment
const tagOrCommentStartRE = /<\/?(?:[A-Za-z]+\w*)|<!--/;

// Dynamic expressions
const expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)(?:\s*\()?/g;

// HTML Escapes
const escapeRE = /(?:(?:&(?:lt|gt|quot|amp);)|"|\\|\n)/g;
const escapeMap = {
  "&lt;": '<',
  "&gt;": '>',
  "&quot;": "\\\"",
  "&amp;": '&',
  '\\': "\\\\",
  '"': "\\\"",
  '\n': "\\n"
}

// Global Variables/Keywords
const globals = ["instance", "staticNodes", "true", "false", "undefined", "null", "NaN", "typeof", "in"];

// Void and SVG Elements
const VOID_ELEMENTS = ["area", "base", "br", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
const SVG_ELEMENTS = ["animate", "circle", "clippath", "cursor", "defs", "desc", "ellipse", "filter", "font-face", "foreignObject", "g", "glyph", "image", "line", "marker", "mask", "missing-glyph", "path", "pattern", "polygon", "polyline", "rect", "svg", "switch", "symbol", "text", "textpath", "tspan", "use", "view"];


const lex = function(template) {
  const length = template.length;
  let tokens = [];
  let current = 0;

  while(current < length) {
    let char = template[current];
    if(char === '<') {
      current++;
      if(template.substring(current, current + 3) === "!--") {
        // Comment
        current += 3;
        const endOfComment = template.indexOf("-->", current);
        if(endOfComment === -1) {
          current = length;
        } else {
          current = endOfComment + 3;
        }
      } else {
        // Tag
        let tagToken = {
          type: "Tag"
        }
        let tagType = '';

        while(current < length) {

        }

        tagToken.value = tagType;
        tokens.push(tagToken);
      }
    } else {
      // Text
      const textTail = template.substring(current);
      const endOfText = textTail.search(tagOrCommentStartRE);
      let text;
      if(endOfText === -1) {
        text = textTail;
        current = length;
      } else {
        text = textTail.substring(0, endOfText);
        current += endOfText;
      }
      if(text.replace(whitespaceRE, '').length !== 0) {
        tokens.push({
          type: "Text",
          value: text.replace(escapeRE, function(match) {
            return escapeMap[match];
          })
        });
      }
    }
  }

  return tokens;
}

console.log(JSON.stringify(lex("<div></div>"), null, 2))

const lex = function(template) {
  const length = template.length;
  let tokens = [];
  let current = 0;

  while(current < length) {
    let char = template[current];
    if(char === '<') {
      current++;
      if(template.substring(current, current + 3) === "!--") {
        // Comment
        current += 3;
        const endOfComment = template.indexOf("-->", current);
        if(endOfComment === -1) {
          current = length;
        } else {
          current = endOfComment + 3;
        }
      } else {
        // Tag
        let tagToken = {
          type: "Tag",
          value: ''
        }

        let tagType = '';
        let attributes = {};

        let closeStart = false;
        let closeEnd = false;

        char = template[current];

        // Exit starting closing slash
        if(char === '/') {
          char = template[++current];
          closeStart = true;
        }

        // Get tag name
        while((current < length) && ((char !== '>') && (char !== '/') && (whitespaceCharRE.test(char) === false))) {
          tagType += char;
          char = template[++current];
        }

        // Iterate to end of tag
        while((current < length) && ((char !== '>') && (char !== '/' || template[current + 1] !== '>'))) {
          if(whitespaceCharRE.test(char) === true) {
            // Skip whitespace
            char = template[++current];
          } else {
            // Find attribute name
            let attrName = '';
            let attrValue = '';
            while((current < length) && ((char !== '=') && (whitespaceCharRE.test(char) === false) && ((char !== '>') && (char !== '/' || template[current + 1] !== '>')))) {
              attrName += char;
              char = template[++current];
            }

            // Find attribute value
            if(char === '=') {
              char = template[++current];

              let quoteType = ' ';
              if(char === '"' || char === '\'' || char === ' ' || char === '\n') {
                quoteType = char;
                char = template[++current];
              }

              // Iterate to end of quote type, or end of tag
              while((current < length) && ((char !== '>') && (char !== '/' || template[current + 1] !== '>'))) {
                if(char === quoteType) {
                  char = template[++current];
                  break;
                } else {
                  attrValue += char;
                  char = template[++current];
                }
              }
            }

            let attrToken = {
              name: attrName,
              value: attrValue,
              argument: undefined,
              data: {}
            }

            const splitAttrName = attrName.split(':');
            if(splitAttrName.length === 2) {
              attrToken.name = splitAttrName[0];
              attrToken.argument = splitAttrName[1];
            }

            attributes[attrName] = attrToken;
          }
        }

        if(char === '/') {
          current += 2;
          closeEnd = true;
        } else {
          current++;
        }

        tagToken.value = tagType;
        tagToken.attributes = attributes;
        tagToken.closeStart = closeStart;
        tagToken.closeEnd = closeEnd;
        tokens.push(tagToken);
      }
    } else {
      // Text
      const textTail = template.substring(current);
      const endOfText = textTail.search(tagOrCommentStartRE);
      let text;
      if(endOfText === -1) {
        text = textTail;
        current = length;
      } else {
        text = textTail.substring(0, endOfText);
        current += endOfText;
      }
      if(text.replace(whitespaceRE, '').length !== 0) {
        tokens.push({
          type: "Text",
          value: text.replace(escapeRE, function(match) {
            return escapeMap[match];
          })
        });
      }
    }
  }

  return tokens;
}
