/**
 * Moon Browser v1.0.0-beta.4
 * Copyright 2016-2019 Kabir Shah
 * Released under the MIT License
 * https://kbrsh.github.io/moon
 */
(function () {
	"use strict";

	/**
	 * Matches an identifier character.
	 */
	var identifierRE = /[@$\w.?]/;
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
		empty: function empty(input, index) {
			return ["", index];
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
		whitespace: parser.alternates([parser.character(" "), parser.character("\t"), parser.character("\n")]),
		whitespaces: function whitespaces(input, index) {
			return parser.many(grammar.whitespace)(input, index);
		},
		identifier: parser.many1(parser.regex(identifierRE)),
		string: parser.alternates([parser.sequence([parser.character("\""), parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["\""]))), parser.character("\"")]), parser.sequence([parser.character("'"), parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["'"]))), parser.character("'")]), parser.sequence([parser.character("`"), parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["`"]))), parser.character("`")])]),
		block: function block(input, index) {
			return parser.type("block", parser.sequence([parser.character("{"), grammar.expression, parser.character("}")]))(input, index);
		},
		value: function value(input, index) {
			return parser.alternates([grammar.string, grammar.block, grammar.identifier])(input, index);
		},
		text: parser.type("text", parser.many1(parser.not(["{", "<"]))),
		attributes: function attributes(input, index) {
			return parser.type("attributes", parser.many(parser.sequence([grammar.identifier, parser.character("="), grammar.value, grammar.whitespaces])))(input, index);
		},
		node: function node(input, index) {
			return parser.type("node", parser.sequence([parser.character("<"), grammar.whitespaces, grammar.value, grammar.whitespaces, parser.string("#>")]))(input, index);
		},
		nodeData: function nodeData(input, index) {
			return parser.type("nodeData", parser.sequence([parser.character("<"), grammar.whitespaces, grammar.value, grammar.whitespaces, parser.or(grammar.block, grammar.attributes), parser.string("/>")]))(input, index);
		},
		nodeDataChildren: function nodeDataChildren(input, index) {
			return parser.type("nodeDataChildren", parser.sequence([parser.character("<"), grammar.whitespaces, grammar.value, grammar.whitespaces, grammar.attributes, parser.character(">"), parser.many(parser.alternates([grammar.node, grammar.nodeData, grammar.nodeDataChildren, grammar.block, grammar.text])), parser.string("</"), parser.many(parser.not([">"])), parser.character(">")]))(input, index);
		},
		expression: function expression(input, index) {
			return parser.many(parser.alternates([// Single line comment
			parser.sequence([parser.string("//"), parser.many(parser.not(["\n"]))]), // Multi-line comment
			parser.sequence([parser.string("/*"), parser.many(parser.not(["*/"])), parser.string("*/")]), // Regular expression
			parser.sequence([parser.character("/"), parser.many1(parser.or(parser.and(parser.character("\\"), parser.not(["\n"])), parser.not(["/", "\n"]))), parser.character("/")]), grammar.string, grammar.block, grammar.node, grammar.nodeData, grammar.nodeDataChildren, // Anything up to a comment, regular expression, block, view, or string.
			// Allow failed regular expression or view parses to be interpreted as
			// operators.
			parser.and(parser.alternates([parser.character("/"), parser.character("<"), parser.empty]), parser.many1(parser.not(["/", "{", "}", "<", "\"", "'", "`"])))]))(input, index);
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
	 * @returns {Object} abstract syntax tree and end index or ParseError
	 */

	function parse(input) {
		return grammar.main(input, 0);
	}

	parse.Error = ParseError;

	/**
	 * Generate a parser value node.
	 *
	 * @param {object} tree
	 * @returns {string|object} generator result
	 */
	function generateValue(tree) {
		if (tree.type === "block") {
			// In values, blocks are only generated to the expression inside of them.
			return "(" + generate(tree.value[1]) + ")";
		} else {
			// All other value types are generated normally.
			return generate(tree);
		}
	}
	/**
	 * Generator
	 *
	 * The generator takes parse nodes and converts them to strings representing
	 * JavaScript code. All code is generated the same, but Moon view expressions
	 * are converted to function calls or variable references.
	 *
	 * @param {object} tree
	 * @returns {string|object} generator result
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
		} else if (type === "block") {
			return generate(tree.value);
		} else if (type === "text") {
			return "Moon.view.m.text({value:" + JSON.stringify(generate(tree.value)) + "})";
		} else if (type === "attributes") {
			var value = tree.value;
			var _output = "";
			var separator = "";

			for (var _i = 0; _i < value.length; _i++) {
				var pair = value[_i];
				_output += separator + "\"" + generate(pair[0]) + "\":" + generateValue(pair[2]) + generate(pair[3]);
				separator = ",";
			}

			return {
				output: _output,
				separator: separator
			};
		} else if (type === "node") {
			// Nodes represent a variable reference.
			var _value = tree.value;
			return generate(_value[1]) + generateValue(_value[2]) + generate(_value[3]);
		} else if (type === "nodeData") {
			// Data nodes represent calling a function with either a custom data
			// expression or an object using attribute syntax.
			var _value2 = tree.value;
			var data = _value2[4];
			return "" + generate(_value2[1]) + generateValue(_value2[2]) + generate(_value2[3]) + "(" + (data.type === "attributes" ? "{" + generate(data).output + "}" : generate(data.value[1])) + ")";
		} else if (type === "nodeDataChildren") {
			// Data and children nodes represent calling a function with a data
			// object using attribute syntax and children.
			var _value3 = tree.value;

			var _data = generate(_value3[4]);

			var children = _value3[6];
			var childrenLength = children.length;
			var outputChildren;

			if (childrenLength === 0) {
				outputChildren = "";
			} else {
				var _separator = "";
				outputChildren = _data.separator + "children:[";

				for (var _i2 = 0; _i2 < childrenLength; _i2++) {
					var child = children[_i2];

					if (child.type === "block") {
						outputChildren += _separator + "Moon.view.m.text({value:" + generate(child.value[1]) + "})";
					} else {
						outputChildren += _separator + generate(child);
					}

					_separator = ",";
				}

				outputChildren += "]";
			}

			return "" + generate(_value3[1]) + generateValue(_value3[2]) + generate(_value3[3]) + "({" + _data.output + outputChildren + "})";
		}
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
	 * Logs an error message to the console.
	 * @param {string} message
	 */
	function error(message) {
		console.error("[Moon] ERROR: " + message);
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
		parse: parse
	};

	/**
	 * Head element
	 */

	var head;
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
				scriptNew.text = compiler.compile(script.text);
				head.appendChild(scriptNew);
				script.parentNode.removeChild(script);
				load();
			} else {
				var xhr = new XMLHttpRequest();

				xhr.onload = function () {
					if (xhr.readyState === xhr.DONE) {
						if (xhr.status === 0 || xhr.status === 200) {
							var _scriptNew = document.createElement("script");

							_scriptNew.text = compiler.compile(xhr.responseText);
							head.appendChild(_scriptNew);
						} else {
							error("Failed to load script with source \"" + src + "\" and status " + xhr.status + ".");
						}

						script.parentNode.removeChild(script);
						load();
					}
				};

				xhr.open("GET", src, true);
				xhr.send();
			}
		}
	}

	document.addEventListener("DOMContentLoaded", function () {
		var scriptElements = document.querySelectorAll("script");
		head = document.querySelector("head");

		for (var i = 0; i < scriptElements.length; i++) {
			var scriptElement = scriptElements[i];

			if (scriptElement.type === "text/moon") {
				scripts.push(scriptElement);
			}
		}

		load();
	});

}());