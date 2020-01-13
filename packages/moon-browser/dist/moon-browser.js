/**
 * Moon Browser v1.0.0-beta.5
 * Copyright 2016-2020 Kabir Shah
 * Released under the MIT License
 * https://moonjs.org
 */
(function () {
	"use strict";

	/**
	 * Matches an identifier character.
	 */
	var identifierRE = /[@$\w.]/;
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
			return index === input.length ? ["EOF", index] : new ParseError("EOF", index);
		},
		any: function any(input, index) {
			return index < input.length ? [input[index], index + 1] : new ParseError("any", index);
		},
		character: function character(_character) {
			return function (input, index) {
				var head = input[index];
				return head === _character ? [head, index + 1] : new ParseError("\"" + _character + "\"", index);
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
				return input.slice(index, indexNew) === _string ? [_string, indexNew] : new ParseError("\"" + _string + "\"", index);
			};
		},
		not: function not(strings) {
			return function (input, index) {
				if (index < input.length) {
					for (var i = 0; i < strings.length; i++) {
						var string = strings[i];

						if (input.slice(index, index + string.length) === string) {
							return new ParseError("not \"" + string + "\"", index);
						}
					}

					return [input[index], index + 1];
				} else {
					return new ParseError("not " + strings.map(JSON.stringify).join(", "), index);
				}
			};
		},
		or: function or(parse1, parse2) {
			return function (input, index) {
				var output1 = parse1(input, index);

				if (output1 instanceof ParseError) {
					var output2 = parse2(input, index);

					if (output2 instanceof ParseError) {
						// For now, the first branch is unreachable because all uses of
						// "or" in the grammar do not have a valid case where both
						// alternates fail where the first one is fails after the the
						// second.

						/* istanbul ignore next */
						return output1.index > output2.index ? output1 : output2;
					} else {
						return output2;
					}
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
				var alternatesError = new ParseError("alternates", -1);

				for (var i = 0; i < parses.length; i++) {
					var output = parses[i](input, index);

					if (output instanceof ParseError) {
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

				return [values, index];
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

				return [values, index];
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
		value: function value(input, index) {
			return parser.alternates([parser.many1(parser.regex(identifierRE)), parser.sequence([parser.character("\""), parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["\""]))), parser.character("\"")]), parser.sequence([parser.character("'"), parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["'"]))), parser.character("'")]), parser.sequence([parser.character("`"), parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["`"]))), parser.character("`")]), parser.sequence([parser.character("("), grammar.expression, parser.character(")")]), parser.sequence([parser.character("["), grammar.expression, parser.character("]")]), parser.sequence([parser.character("{"), grammar.expression, parser.character("}")])])(input, index);
		},
		attributes: function attributes(input, index) {
			return parser.type("attributes", parser.many(parser.sequence([grammar.value, parser.character("="), grammar.value, grammar.separator])))(input, index);
		},
		text: parser.type("text", parser.many1(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["{", "<"])))),
		interpolation: function interpolation(input, index) {
			return parser.type("interpolation", parser.sequence([parser.character("{"), grammar.expression, parser.character("}")]))(input, index);
		},
		node: function node(input, index) {
			return parser.type("node", parser.sequence([parser.character("<"), grammar.separator, grammar.value, grammar.separator, parser.string("*>")]))(input, index);
		},
		nodeData: function nodeData(input, index) {
			return parser.type("nodeData", parser.sequence([parser.character("<"), grammar.separator, grammar.value, grammar.separator, parser.or(parser.and(grammar.value, parser.string("/>")), parser.and(grammar.attributes, parser.string("/>")))]))(input, index);
		},
		nodeDataChildren: function nodeDataChildren(input, index) {
			return parser.type("nodeDataChildren", parser.sequence([parser.character("<"), grammar.separator, grammar.value, grammar.separator, grammar.attributes, parser.character(">"), parser.many(parser.alternates([grammar.node, grammar.nodeData, grammar.nodeDataChildren, grammar.text, grammar.interpolation])), parser.string("</"), parser.many(parser.not([">"])), parser.character(">")]))(input, index);
		},
		expression: function expression(input, index) {
			return parser.many(parser.alternates([// Single line comment
			parser.sequence([parser.string("//"), parser.many(parser.not(["\n"]))]), // Multi-line comment
			parser.sequence([parser.string("/*"), parser.many(parser.not(["*/"])), parser.string("*/")]), // Regular expression
			parser.sequence([parser.character("/"), parser.many1(parser.or(parser.and(parser.character("\\"), parser.not(["\n"])), parser.not(["/", "\n"]))), parser.character("/")]), grammar.comment, grammar.value, grammar.node, grammar.nodeData, grammar.nodeDataChildren, // Allow failed regular expression or view parses to be interpreted as
			// operators.
			parser.character("/"), parser.character("<"), // Anything up to a comment, regular expression, string, parenthetical,
			// array, object, or view. Only matches to the opening bracket of a view
			// because the view parsers do not require an expression to finish
			// parsing before consuming the closing bracket. Parentheticals, arrays,
			// and objects, however, parse expressions before their closing
			// delimiter, depending on the expression parser to stop before it.
			parser.many1(parser.not(["/", "#", "\"", "'", "`", "(", ")", "[", "]", "{", "}", "<"]))]))(input, index);
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

	parse.Error = ParseError;

	/**
	 * Matches whitespace.
	 */
	var whitespaceRE = /^\s+$/;
	/**
	 * Matches unescaped special characters in text.
	 */

	var textSpecialRE = /(^|[^\\])("|\n)/g;
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
				_output += separator + "\"" + generate(pair[0]) + "\":" + generate(pair[2]) + generate(pair[3]);
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
				output: textGeneratedIsWhitespace ? textGenerated : "Moon.view.m.text({data:\"" + textGenerated.replace(textSpecialRE, function (match, character, characterSpecial) {
					return character + (characterSpecial === "\"" ? "\\\"" : "\\n\\\n");
				}) + "\"})",
				isWhitespace: textGeneratedIsWhitespace
			};
		} else if (type === "interpolation") {
			return "Moon.view.m.text({data:" + generate(tree.value[1]) + "})";
		} else if (type === "node") {
			// Nodes represent a variable reference.
			var _value = tree.value;
			return generate(_value[1]) + generate(_value[2]) + generate(_value[3]);
		} else if (type === "nodeData") {
			// Data nodes represent calling a function with either a custom data
			// expression or an object using attribute syntax.
			var _value2 = tree.value;
			var data = _value2[4][0];
			var dataGenerated = generate(data);
			return "" + generate(_value2[1]) + generate(_value2[2]) + generate(_value2[3]) + "(" + (data.type === "attributes" ? "{" + dataGenerated.output + "}" : dataGenerated) + ")";
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

				for (var _i2 = 0; _i2 < childrenLength; _i2++) {
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

			return "" + generate(_value3[1]) + generate(_value3[2]) + generate(_value3[3]) + "({" + _data.output + childrenGenerated + "})";
		}
	}

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
	 * Formats lines surrounding a certain index in a string.
	 *
	 * @param {string} input
	 * @param {number} index
	 * @returns {string} formatted lines
	 */

	function format(input, index) {
		var lines = input.split("\n");
		var lineNumber = 1;
		var columnNumber = 1;

		for (var i = 0; i < input.length; i++) {
			var character = input[i];

			if (i === index) {
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

		if (parseOutput instanceof parse.Error) {
			error("Invalid input to parser.\n\nAttempted to parse input.\n\nExpected " + parseOutput.expected + ".\n\nReceived:\n\n" + format(input, parseOutput.index));
		}

		return generate(parseOutput[0][0]);
	}

	var compiler = {
		compile: compile,
		generate: generate,
		parse: parse,
		version: "1.0.0-beta.5"
	};

	/**
	 * Script elements
	 */

	var scripts = [];
	/**
	 * Load scripts in the order they appear.
	 */

	function load() {
		if (scripts.length !== 0) {
			var script = scripts.shift();
			var src = script.src;

			if (src.length === 0) {
				var scriptNew = document.createElement("script");
				scriptNew.type = "text/javascript";
				scriptNew.text = compiler.compile(script.text);
				script.parentNode.replaceChild(scriptNew, script);
				load();
			} else {
				var xhr = new XMLHttpRequest();
				xhr.responseType = "text";

				xhr.onload = function () {
					if (xhr.status === 0 || xhr.status === 200) {
						var _scriptNew = document.createElement("script");

						_scriptNew.type = "text/javascript";
						_scriptNew.text = compiler.compile(xhr.response);
						script.parentNode.replaceChild(_scriptNew, script);
					} else {
						error("Invalid script HTTP response.\n\nAttempted to download script:\n\t" + src + "\n\nReceived error HTTP status code:\n\t" + xhr.status + "\n\nExpected OK HTTP status code 0 or 200.");
					}

					load();
				};

				xhr.onerror = function () {
					error("Failed script HTTP request.\n\nAttempted to download script:\n\t" + src + "\n\nReceived error.\n\nExpected successful HTTP request.");
					load();
				};

				xhr.open("GET", src, true);
				xhr.send(null);
			}
		}
	}

	document.addEventListener("DOMContentLoaded", function () {
		var scriptsAll = document.querySelectorAll("script");

		for (var i = 0; i < scriptsAll.length; i++) {
			var script = scriptsAll[i];

			if (script.type === "text/moon") {
				scripts.push(script);
			}
		}

		load();
	});

}());
