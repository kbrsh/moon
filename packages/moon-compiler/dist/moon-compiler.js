/**
 * Moon Compiler v1.0.0-beta.7
 * Copyright 2016-2020 Kabir Shah
 * Released under the MIT License
 * https://moonjs.org
 */
(function(root, factory) {
	if (typeof module === "undefined") {
		root.MoonCompiler = factory();
	} else {
		module.exports = factory();
	}
}(this, function() {
	"use strict";

	/**
	 * Matches an identifier character.
	 */
	var identifierRE = /^[.*$\w]/;
	/**
	 * Stores an error message, a slice of tokens associated with the error, and a
	 * related error for later reporting.
	 */

	function ParseError(expected, index) {
		this.expected = expected;
		this.index = index;
	}
	/**
	 * Parser combinators
	 */


	var parser = {
		type: function type(_type, parse) {
			return function (input, index) {
				var output = parse(input, index);
				return output instanceof ParseError ? output : [{
					type: _type,
					value: output[0]
				}, output[1]];
			};
		},
		EOF: function EOF(input, index) {
			// EOF errors should be unreachable because the expression parser should
			// never error after looking ahead one character and stop consuming input
			// before reaching the end.
			return index === input.length ? ["EOF", index] :
			/* istanbul ignore next */
			new ParseError("EOF", index);
		},
		any: function any(input, index) {
			return index < input.length ? [input[index], index + 1] : new ParseError("any", index);
		},
		character: function character(_character) {
			return function (input, index) {
				var head = input[index];
				return head === _character ? [head, index + 1] : new ParseError(_character, index);
			};
		},
		regex: function regex(_regex) {
			return function (input, index) {
				var head = input[index];
				return head !== undefined && _regex.test(head) ? [head, index + 1] : new ParseError(_regex.toString(), index);
			};
		},
		string: function string(_string) {
			return function (input, index) {
				var indexNew = index + _string.length;
				return input.slice(index, indexNew) === _string ? [_string, indexNew] : new ParseError(_string, index);
			};
		},
		not: function not(matchers) {
			return function (input, index) {
				if (index < input.length) {
					for (var i = 0; i < matchers.length; i++) {
						var matcher = matchers[i];

						if (typeof matcher === "string") {
							if (input.slice(index, index + matcher.length) === matcher) {
								return new ParseError("not " + matcher, index);
							}
						} else {
							if (matcher.test(input.slice(index))) {
								return new ParseError("not " + matcher.toString(), index);
							}
						}
					}

					return [input[index], index + 1];
				} else {
					return new ParseError("not " + matchers.join(", "), index);
				}
			};
		},
		or: function or(parse1, parse2) {
			return function (input, index) {
				var output1 = parse1(input, index);

				if (output1 instanceof ParseError && output1.index === index) {
					// If the first parser has an error and consumes no input, then try
					// the second parser.
					return parse2(input, index);
				} else {
					return output1;
				}
			};
		},
		and: function and(parse1, parse2) {
			return function (input, index) {
				var output1 = parse1(input, index);

				if (output1 instanceof ParseError) {
					return output1;
				} else {
					var output2 = parse2(input, output1[1]);
					return output2 instanceof ParseError ? output2 : [[output1[0], output2[0]], output2[1]];
				}
			};
		},
		sequence: function sequence(parses) {
			return function (input, index) {
				var values = [];

				for (var i = 0; i < parses.length; i++) {
					var output = parses[i](input, index);

					if (output instanceof ParseError) {
						return output;
					} else {
						values.push(output[0]);
						index = output[1];
					}
				}

				return [values, index];
			};
		},
		alternates: function alternates(parses) {
			return function (input, index) {
				var alternatesError = new ParseError("", -1);

				for (var i = 0; i < parses.length; i++) {
					var output = parses[i](input, index);

					if (output instanceof ParseError && output.index === index) {
						if (output.index > alternatesError.index) {
							alternatesError = output;
						}
					} else {
						return output;
					}
				}

				return alternatesError;
			};
		},
		many: function many(parse) {
			return function (input, index) {
				var values = [];
				var output;

				while (!((output = parse(input, index)) instanceof ParseError)) {
					values.push(output[0]);
					index = output[1];
				}

				if (output.index === index) {
					return [values, index];
				} else {
					return output;
				}
			};
		},
		many1: function many1(parse) {
			return function (input, index) {
				var values = [];
				var output = parse(input, index);

				if (output instanceof ParseError) {
					return output;
				}

				values.push(output[0]);
				index = output[1];

				while (!((output = parse(input, index)) instanceof ParseError)) {
					values.push(output[0]);
					index = output[1];
				}

				if (output.index === index) {
					return [values, index];
				} else {
					return output;
				}
			};
		},
		"try": function _try(parse) {
			return function (input, index) {
				var output = parse(input, index);

				if (output instanceof ParseError) {
					output.index = index;
				}

				return output;
			};
		}
	};
	/**
	 * Moon View Language Grammar
	 */

	var grammar = {
		comment: parser.type("comment", parser.sequence([parser.character("#"), parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["#"]))), parser.character("#")])),
		separator: function separator(input, index) {
			return parser.many(parser.or(parser.alternates([parser.character(" "), parser.character("\t"), parser.character("\n")]), grammar.comment))(input, index);
		},
		identifier: parser.many1(parser.regex(identifierRE)),
		attributes: function attributes(input, index) {
			return parser.type("attributes", parser.many(parser.sequence([grammar.identifier, parser.character("="), grammar.value, grammar.separator])))(input, index);
		},
		text: parser.type("text", parser.many1(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["{", "<"])))),
		interpolation: function interpolation(input, index) {
			return parser.type("interpolation", parser.sequence([parser.character("{"), grammar.expression, parser.character("}")]))(input, index);
		},
		node: function node(input, index) {
			return parser.type("node", parser.sequence([parser.string("</"), grammar.separator, grammar.value, grammar.separator, parser.string("/>")]))(input, index);
		},
		nodeData: function nodeData(input, index) {
			return parser.type("nodeData", parser.sequence([parser.character("<"), grammar.separator, grammar.value, grammar.separator, parser.or(parser["try"](parser.and(grammar.value, parser.string("/>"))), parser.and(grammar.attributes, parser.string("/>")))]))(input, index);
		},
		nodeDataChildren: function nodeDataChildren(input, index) {
			return parser.type("nodeDataChildren", parser.sequence([parser.character("<"), grammar.separator, grammar.value, grammar.separator, grammar.attributes, parser.character(">"), parser.many(parser.alternates([parser["try"](grammar.node), parser["try"](grammar.nodeData), parser["try"](grammar.nodeDataChildren), grammar.text, grammar.interpolation])), parser.string("</"), parser.many(parser.not([">"])), parser.character(">")]))(input, index);
		},
		value: function value(input, index) {
			return parser.alternates([grammar.identifier, parser.sequence([parser.character("\""), parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["\""]))), parser.character("\"")]), parser.sequence([parser.character("'"), parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["'"]))), parser.character("'")]), parser.sequence([parser.character("`"), parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["`"]))), parser.character("`")]), parser.sequence([parser.character("("), grammar.expression, parser.character(")")]), parser.sequence([parser.character("["), grammar.expression, parser.character("]")]), parser.sequence([parser.character("{"), grammar.expression, parser.character("}")]), parser["try"](grammar.node), parser["try"](grammar.nodeData), parser["try"](grammar.nodeDataChildren)])(input, index);
		},
		expression: function expression(input, index) {
			return parser.many(parser.alternates([// Single line comment
			parser.sequence([parser.string("//"), parser.many(parser.not(["\n"]))]), // Multi-line comment
			parser.sequence([parser.string("/*"), parser.many(parser.not(["*/"])), parser.string("*/")]), // Regular expression
			parser["try"](parser.sequence([parser.character("/"), parser.many1(parser.or(parser.and(parser.character("\\"), parser.not(["\n"])), parser.not(["/", "\n"]))), parser.character("/")])), // Moon language additions
			grammar.comment, grammar.value, // Allow failed regular expression or view parses to be interpreted as
			// operators.
			parser.character("/"), parser.character("<"), parser.character(">"), // Anything up to a comment, regular expression, Moon comment,
			// identifier, string, parenthetical, array, object, or view.
			parser.many1(parser.not(["/", "#", identifierRE, "\"", "'", "`", "(", ")", "[", "]", "{", "}", "<", ">"]))]))(input, index);
		},
		main: function main(input, index) {
			return parser.and(grammar.expression, parser.EOF)(input, index);
		}
	};
	/**
	 * Parser
	 *
	 * The parser is responsible for taking a list of tokens to return an abstract
	 * syntax tree of a JavaScript file using the Moon View Language. It is built
	 * up of smaller parsers, which each take an input and a start index. They
	 * either return a parser node and an end index signifying the consumed input
	 * or a parser error.
	 *
	 * @param {string} input
	 * @returns {object} abstract syntax tree and end index or ParseError
	 */

	function parse(input) {
		return grammar.main(input, 0);
	}

	/**
	 * Moon component names
	 */
	var namesMoon = ["root", "router", "timer", "httper"];
	/**
	 * HTML element names
	 */

	var namesElement = ["a", "abbr", "acronym", "address", "applet", "article", "aside", "audio", "b", "basefont", "bdi", "bdo", "bgsound", "big", "blink", "blockquote", "body", "button", "canvas", "caption", "center", "cite", "code", "colgroup", "command", "content", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "html", "i", "iframe", "image", "ins", "isindex", "kbd", "label", "legend", "li", "listing", "main", "map", "mark", "marquee", "math", "menu", "menuitem", "meter", "multicol", "nav", "nextid", "nobr", "noembed", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "picture", "plaintext", "pre", "progress", "q", "rb", "rbc", "rp", "rt", "rtc", "ruby", "s", "samp", "script", "section", "select", "shadow", "slot", "small", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "svg", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "tt", "u", "ul", "var", "video", "xmp"];
	/**
	 * Empty HTML element names
	 */

	var namesElementEmpty = ["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "text", "track", "wbr"];
	/**
	 * Component names
	 */

	var names = namesMoon.concat(namesElement).concat(namesElementEmpty);
	/**
	 * Logs an error message to the console.
	 * @param {string} message
	 */

	function error(message) {
		console.error("[Moon] ERROR: " + message);
	}
	/**
	 * Pads a string with spaces on the left to match a certain length.
	 *
	 * @param {string} string
	 * @param {number} length
	 * @returns {string} padded string
	 */

	function pad(string, length) {
		var remaining = length - string.length;

		for (var i = 0; i < remaining; i++) {
			string = " " + string;
		}

		return string;
	}

	/**
	 * Matches whitespace.
	 */

	var whitespaceRE = /^\s+$/;
	/**
	 * Matches unescaped special characters in text.
	 */

	var textSpecialRE = /(^|[^\\])("|\n)/g;
	/**
	 * Generates a name for a function call.
	 *
	 * @param {string} nameTree
	 * @returns {string} function name
	 */

	function generateName(nameTree) {
		var name = generate(nameTree);
		return names.indexOf(name) === -1 ? name : "Moon.components." + name;
	}
	/**
	 * Generator
	 *
	 * The generator takes parse nodes and converts them to strings representing
	 * JavaScript code. All code is generated the same, but Moon view expressions
	 * are converted to function calls or variable references.
	 *
	 * @param {object} tree
	 * @returns {string} generator result
	 */


	function generate(tree) {
		var type = tree.type;

		if (typeof tree === "string") {
			return tree;
		} else if (Array.isArray(tree)) {
			var output = "";

			for (var i = 0; i < tree.length; i++) {
				output += generate(tree[i]);
			}

			return output;
		} else if (type === "comment") {
			return "/*" + generate(tree.value[1]) + "*/";
		} else if (type === "attributes") {
			var value = tree.value;
			var _output = "";
			var separator = "";

			for (var _i = 0; _i < value.length; _i++) {
				var pair = value[_i];
				var pairKey = generate(pair[0]);
				var pairValue = generate(pair[2]);

				if (pairKey[0] === "*") {
					pairValue = "{value:\"" + pairValue + "\",get:function(m){return m" + pairValue + ";},set:function(m,MoonValue){m" + pairValue + "=MoonValue;return m;}}";
				}

				_output += separator + "\"" + pairKey + "\":" + pairValue + generate(pair[3]);
				separator = ",";
			}

			return {
				output: _output,
				separator: separator
			};
		} else if (type === "text") {
			var textGenerated = generate(tree.value);
			var textGeneratedIsWhitespace = whitespaceRE.test(textGenerated) && textGenerated.indexOf("\n") !== -1; // Text that is only whitespace with at least one newline is ignored and
			// added only to preserve newlines in the generated code.

			return {
				output: textGeneratedIsWhitespace ? textGenerated : "Moon.components.text({data:\"" + textGenerated.replace(textSpecialRE, function (match, character, characterSpecial) {
					return character + (characterSpecial === "\"" ? "\\\"" : "\\n\\\n");
				}) + "\"})",
				isWhitespace: textGeneratedIsWhitespace
			};
		} else if (type === "interpolation") {
			return "Moon.components.text({data:" + generate(tree.value[1]) + "})";
		} else if (type === "node") {
			// Nodes represent a variable reference.
			var _value = tree.value;
			return generate(_value[1]) + generateName(_value[2]) + generate(_value[3]);
		} else if (type === "nodeData") {
			// Data nodes represent calling a function with either a custom data
			// expression or an object using attribute syntax.
			var _value2 = tree.value;
			var data = _value2[4][0];
			var dataGenerated = generate(data);
			return "" + generate(_value2[1]) + generateName(_value2[2]) + generate(_value2[3]) + "(" + (data.type === "attributes" ? "{" + dataGenerated.output + "}" : dataGenerated) + ")";
		} else if (type === "nodeDataChildren") {
			// Data and children nodes represent calling a function with a data
			// object using attribute syntax and children.
			var _value3 = tree.value;

			var _data = generate(_value3[4]);

			var children = _value3[6];
			var childrenLength = children.length;
			var childrenGenerated;

			if (childrenLength === 0) {
				childrenGenerated = "";
			} else {
				var _separator = "";
				childrenGenerated = _data.separator + "children:[";

				for (var _i2 = 0; _i2 < children.length; _i2++) {
					var child = children[_i2];
					var childGenerated = generate(child);

					if (child.type === "text") {
						if (childGenerated.isWhitespace) {
							childrenGenerated += childGenerated.output;
						} else {
							childrenGenerated += _separator + childGenerated.output;
							_separator = ",";
						}
					} else {
						childrenGenerated += _separator + childGenerated;
						_separator = ",";
					}
				}

				childrenGenerated += "]";
			}

			return "" + generate(_value3[1]) + generateName(_value3[2]) + generate(_value3[3]) + "({" + _data.output + childrenGenerated + "})";
		}
	}

	/**
	 * Formats lines surrounding a certain index in a string.
	 *
	 * @param {string} input
	 * @param {number} index
	 * @returns {string} formatted lines
	 */

	function format(input, index) {
		// Pad input to account for indexes after the end.
		for (var i = input.length; i <= index; i++) {
			input += " ";
		}

		var lines = input.split("\n");
		var lineNumber = 1;
		var columnNumber = 1;

		for (var _i = 0; _i < input.length; _i++) {
			var character = input[_i];

			if (_i === index) {
				var lineNumberPrevious = lineNumber - 1;
				var lineNumberNext = lineNumber + 1;
				var lineNumberLength = Math.max(Math.floor(Math.log10(lineNumberPrevious) + 1), Math.floor(Math.log10(lineNumber) + 1), Math.floor(Math.log10(lineNumberNext) + 1)) + 2;
				var linePrevious = lines[lineNumberPrevious - 1];
				var line = lines[lineNumber - 1];
				var lineNext = lines[lineNumberNext - 1];
				var formatted = "";

				if (linePrevious !== undefined) {
					formatted += pad(lineNumberPrevious + "| ", lineNumberLength) + linePrevious + "\n";
				}

				formatted += pad(lineNumber + "| ", lineNumberLength) + line + "\n" + pad("| ", lineNumberLength) + pad("^", columnNumber);

				if (lineNext !== undefined) {
					formatted += "\n" + pad(lineNumberNext + "| ", lineNumberLength) + lineNext;
				}

				return formatted;
			}

			if (character === "\n") {
				lineNumber += 1;
				columnNumber = 1;
			} else {
				columnNumber += 1;
			}
		}
	}

	/**
	 * Compiles a JavaScript file with Moon syntax.
	 *
	 * @param {string} input
	 * @returns {string} file code
	 */

	function compile(input) {
		var parseOutput = parse(input);

		if ("development" === "development" && parseOutput.constructor.name === "ParseError") {
			error("Invalid input to parser.\n\nAttempted to parse input.\n\nExpected " + parseOutput.expected + ".\n\nReceived:\n\n" + format(input, parseOutput.index));
		}

		return generate(parseOutput[0][0]);
	}

	var index = {
		compile: compile,
		generate: generate,
		parse: parse,
		version: "1.0.0-beta.7"
	};

	return index;
}));
