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
const escapeRE = /(?:(?:&(?:lt|gt|amp|nbsp|quot);)|"|\\|\n)/g;
const escapeMap = {
  "&lt;": '<',
  "&gt;": '>',
  "&amp;": '&',
  "&nbsp;": ' ',
  "&quot;": "\\\"",
  '\\': "\\\\",
  '"': "\\\"",
  '\n': "\\n"
}

// Global Variables/Keywords
const globals = ["instance", "staticNodes", "true", "false", "undefined", "null", "NaN", "typeof", "in"];

// Void and SVG Elements
const VOID_ELEMENTS = ["area", "base", "br", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
const SVG_ELEMENTS = ["animate", "circle", "clippath", "cursor", "defs", "desc", "ellipse", "filter", "font-face", "foreignObject", "g", "glyph", "image", "line", "marker", "mask", "missing-glyph", "path", "pattern", "polygon", "polyline", "rect", "svg", "switch", "symbol", "text", "textpath", "tspan", "use", "view"];

// Trim Whitespace
const trimWhitespace = function(value) {
  return value.replace(whitespaceRE, '');
}
