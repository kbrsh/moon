// Concatenation Symbol
export const concatenationSymbol = " + ";

// Opening delimiter
export const openRE = /\{\{\s*/;

// Closing delimiter
export const closeRE = /\s*\}\}/;

// Whitespace character
export const whitespaceCharRE = /[\s\n]/;

// All whitespace
const whitespaceRE = /[\s\n]/g;

// Start of a tag or comment
export const tagOrCommentStartRE = /<\/?(?:[A-Za-z]+\w*)|<!--/;

// Dynamic expressions
export const expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)(?:\s*\()?/g;

// HTML Escapes
export const escapeRE = /(?:(?:&(?:amp|gt|lt|nbsp|quot);)|"|\\|\n)/g;
export const escapeMap = {
  "&amp;": '&',
  "&gt;": '>',
  "&lt;": '<',
  "&nbsp;": ' ',
  "&quot;": "\\\"",
  '\\': "\\\\",
  '"': "\\\"",
  '\n': "\\n"
}

// Global Variables/Keywords
export const globals = ["NaN", "false", "in", "instance", 'm', "null", "staticNodes", "true", "typeof", "undefined"];

// Void and SVG Elements
export const VOID_ELEMENTS = ["area", "base", "br", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
export const SVG_ELEMENTS = ["animate", "circle", "clippath", "cursor", "defs", "desc", "ellipse", "filter", "font-face", "foreignObject", "g", "glyph", "image", "line", "marker", "mask", "missing-glyph", "path", "pattern", "polygon", "polyline", "rect", "svg", "switch", "symbol", "text", "textpath", "tspan", "use", "view"];

// Data Flags
export const FLAG_STATIC = 1;
export const FLAG_SVG = 1 << 1;

// Trim Whitespace
export const trimWhitespace = function(value) {
  return value.replace(whitespaceRE, '');
}
