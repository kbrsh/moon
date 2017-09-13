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
const globals = ["true", "false", "undefined", "null", "NaN", "typeof", "in", "event"];

// HTML, Void, and SVG Elements
const HTML_ELEMENTS = ["a", "abbr", "address", "article", "aside", "audio", "b", "bdi", "bdo", "blockquote", "button", "canvas", "caption", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "i", "iframe", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "menu", "menuitem", "meter", "nav", "object", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "rtc", "ruby", "s", "samp", "section", "select", "shadow", "small", "span", "strong", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "u", "ul", "var", "video"];
const VOID_ELEMENTS = ["area", "base", "br", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
const SVG_ELEMENTS = ["animate", "circle", "clippath", "cursor", "defs", "desc", "ellipse", "filter", "font-face", "foreignObject", "g", "glyph", "image", "line", "marker", "mask", "missing-glyph", "path", "pattern", "polygon", "polyline", "rect", "svg", "switch", "symbol", "text", "textpath", "tspan", "use", "view"];
