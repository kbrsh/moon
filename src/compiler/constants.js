// Concatenation Symbol
const concatenationSymbol = " + ";

// Tag start
// Group 1: `/` or `""` (empty string)
const tagStartRE = /^<\s*(\/?)\s*/i;

// Tag name
// Group 1: tag name
const tagNameRE = /^([_A-Z][_A-Z\d\-\.]*)\s*/i;

// Attribute name
// Group 1: attribute name
// Group 2: `=` or `""` (empty string)
const attrNameRE = /^([_A-Z][_A-Z\d\-\.:]*)\s*(=?)\s*/i;

// Attribute value
// Group 1: quote type. `"` or `'`
const attrValueRE = /^(["']?)(.*?)\1\s*/i;

// Tag end
// Group 1: `/` or `""` (empty string)
const tagEndRE = /^(\/?)\s*>/i;

// Opening delimiter
const openRE = /\{\{\s*/;

// Closing delimiter
const closeRE = /\s*\}\}/;

// Whitespace character
const whitespaceCharRE = /[\s]/;

// All whitespace
const whitespaceRE = /[\s]/g;

// Start of a tag or comment
const tagOrCommentStartRE = /<\/?(?:[A-Z]+\w*)|<!--/i;

// Dynamic expressions
const expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)(?:\s*\()?/g;

// HTML Escapes
const escapeRE = /(?:(?:&(?:amp|gt|lt|nbsp|quot);)|"|\\|\n)/g;
const escapeMap = {
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
const globals = ["NaN", "false", "in", "instance", 'm', "null", "staticNodes", "true", "typeof", "undefined"];

// Void and SVG Elements
const VOID_ELEMENTS = ["area", "base", "br", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
const SVG_ELEMENTS = ["animate", "circle", "clippath", "cursor", "defs", "desc", "ellipse", "filter", "font-face", "foreignObject", "g", "glyph", "image", "line", "marker", "mask", "missing-glyph", "path", "pattern", "polygon", "polyline", "rect", "svg", "switch", "symbol", "text", "textpath", "tspan", "use", "view"];

// Data Flags
const FLAG_STATIC = 1;
const FLAG_SVG = 1 << 1;

// Trim Whitespace
const trimWhitespace = function(value) {
  return value.replace(whitespaceRE, '');
}
