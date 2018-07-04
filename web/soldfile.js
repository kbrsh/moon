const Sold = require("sold");
const Handlebars = require("handlebars");

const STR_RE = /((?:&quot;)|'|`)((?:.|\n)*?)\1/g;
const SPECIAL_RE = /\b(new|var|let|if|do|function|while|switch|for|foreach|in|continue|break|return)\b/g;
const GLOBAL_VARIABLE_RE = /\b(document|window|Array|String|undefined|true|false|Object|this|Boolean|Function|Number|\d+(?:\.\d+)?)\b/g;
const CONST_RE = /\b(const )([\w\d]+)/g;
const METHODS_RE = /\b([\w\d]+)\(/g;
const MULTILINE_COMMENT_RE  = /(\/\*.*\*\/)/g;
const COMMENT_RE = /(\/\/.*)/g;
const HTML_COMMENT_RE = /(\&lt;\!\-\-(?:(?:.|\n)*)\-\-\&gt;)/g;
const HTML_ATTRIBUTE_RE = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g;
const HTML_TAG_RE = /(&lt;\/?[\w\d-]*?)(\s(?:.|\n)*?)?(\/?&gt;)/g;
const escapeRE = /&(?:amp|gt|lt);/g;
const escapeMap = {
	"&amp;": '&',
	"&gt;": '>',
	"&lt;": '<'
};

const highlight = function(compiled) {
	compiled = compiled.replace(HTML_COMMENT_RE, "<span class=\"gray\">$1</span>");
	compiled = compiled.replace(HTML_TAG_RE, function(match, start, content, end) {
		if (content === undefined) {
			content = '';
		} else {
			content = content.replace(HTML_ATTRIBUTE_RE, function(match, name, value) {
				if (value !== "string") {
					if (value === undefined) {
						value = '';
					} else {
						value = '=' + value;
					}
					return "<span class=\"orange\">" + name + "</span>" + value;
				}
			});
		}

		return "<span class=\"red\">" + start + "</span>" + content + "<span class=\"red\">" + end + "</span>";
	});

	compiled = compiled.replace(COMMENT_RE, "<span class=\"gray\">$1</span>");
	compiled = compiled.replace(MULTILINE_COMMENT_RE, "<span class=\"gray\">$1</span>");

	compiled = compiled.replace(SPECIAL_RE, "<span class=\"purple\">$1</span>");
	compiled = compiled.replace(GLOBAL_VARIABLE_RE, "<span class=\"orange\">$1</span>");

	compiled = compiled.replace(CONST_RE, "<span class=\"purple\">$1</span><span class=\"orange\">$2</span>");
	compiled = compiled.replace(METHODS_RE, function(match, name) {
		return "<span class=\"blue\">" + name + "</span>(";
	});

	compiled = compiled.replace(STR_RE, "<span class=\"green\">$1$2$1</span>");

	return compiled;
}

Sold({
	root: __dirname,
	template: "template",
	source: "src",
	destination: '',
	engine: "handlebars"
});
