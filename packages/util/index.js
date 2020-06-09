/**
 * Moon component names
 */
export const namesMoon = ["root", "router", "timer", "httper"];

/**
 * HTML element names
 */
export const namesElement = ["a", "abbr", "acronym", "address", "applet", "article", "aside", "audio", "b", "basefont", "bdi", "bdo", "bgsound", "big", "blink", "blockquote", "body", "button", "canvas", "caption", "center", "cite", "code", "colgroup", "command", "content", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "html", "i", "iframe", "image", "ins", "isindex", "kbd", "label", "legend", "li", "listing", "main", "map", "mark", "marquee", "math", "menu", "menuitem", "meter", "multicol", "nav", "nextid", "nobr", "noembed", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "picture", "plaintext", "pre", "progress", "q", "rb", "rbc", "rp", "rt", "rtc", "ruby", "s", "samp", "script", "section", "select", "shadow", "slot", "small", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "svg", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "tt", "u", "ul", "var", "video", "xmp"];

/**
 * Empty HTML element names
 */
export const namesElementEmpty = ["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "text", "track", "wbr"];

/**
 * Component names
 */
export const names = namesMoon.concat(namesElement).concat(namesElementEmpty);

/**
 * Logs an error message to the console.
 * @param {string} message
 */
export function error(message) {
	console.error("[Moon] ERROR: " + message);
}

/**
 * Pads a string with spaces on the left to match a certain length.
 *
 * @param {string} string
 * @param {number} length
 * @returns {string} padded string
 */
export function pad(string, length) {
	const remaining = length - string.length;

	for (let i = 0; i < remaining; i++) {
		string = " " + string;
	}

	return string;
}
