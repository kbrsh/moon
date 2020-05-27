/**
 * Matches an identifier character.
 */
const identifierRE = /[*$\w]/;

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
const parser = {
	type: (type, parse) => (input, index) => {
		const output = parse(input, index);

		return output instanceof ParseError ?
			output :
			[{ type, value: output[0] }, output[1]];
	},
	EOF: (input, index) => {
		// EOF errors should be unreachable because the expression parser should
		// never error after looking ahead one character and stop consuming input
		// before reaching the end.
		return index === input.length ?
			["EOF", index] :
			/* istanbul ignore next */
			new ParseError("EOF", index);
	},
	any: (input, index) => {
		return index < input.length ?
			[input[index], index + 1] :
			new ParseError("any", index);
	},
	character: character => (input, index) => {
		const head = input[index];

		return head === character ?
			[head, index + 1] :
			new ParseError(character, index);
	},
	regex: regex => (input, index) => {
		const head = input[index];

		return head !== undefined && regex.test(head) ?
			[head, index + 1] :
			new ParseError(regex.toString(), index);
	},
	string: string => (input, index) => {
		const indexNew = index + string.length;

		return input.slice(index, indexNew) === string ?
			[string, indexNew] :
			new ParseError(string, index);
	},
	not: strings => (input, index) => {
		if (index < input.length) {
			for (let i = 0; i < strings.length; i++) {
				const string = strings[i];

				if (input.slice(index, index + string.length) === string) {
					return new ParseError(`not ${string}`, index);
				}
			}

			return [input[index], index + 1];
		} else {
			return new ParseError(`not ${strings.join(", ")}`, index);
		}
	},
	or: (parse1, parse2) => (input, index) => {
		const output1 = parse1(input, index);

		if (output1 instanceof ParseError && output1.index === index) {
			// If the first parser has an error and consumes no input, then try
			// the second parser.
			return parse2(input, index);
		} else {
			return output1;
		}
	},
	and: (parse1, parse2) => (input, index) => {
		const output1 = parse1(input, index);

		if (output1 instanceof ParseError) {
			return output1;
		} else {
			const output2 = parse2(input, output1[1]);

			return output2 instanceof ParseError ?
				output2 :
				[[output1[0], output2[0]], output2[1]];
		}
	},
	optional: parse => (input, index) => {
		const output = parse(input, index);

		if (output instanceof ParseError && output.index === index) {
			return [[], index];
		} else {
			return output;
		}
	},
	sequence: parses => (input, index) => {
		const values = [];

		for (let i = 0; i < parses.length; i++) {
			const output = parses[i](input, index);

			if (output instanceof ParseError) {
				return output;
			} else {
				values.push(output[0]);
				index = output[1];
			}
		}

		return [values, index];
	},
	alternates: parses => (input, index) => {
		let alternatesError = new ParseError("", -1);

		for (let i = 0; i < parses.length; i++) {
			const output = parses[i](input, index);

			if (output instanceof ParseError && output.index === index) {
				if (output.index > alternatesError.index) {
					alternatesError = output;
				}
			} else {
				return output;
			}
		}

		return alternatesError;
	},
	many: parse => (input, index) => {
		const values = [];
		let output;

		while (!((output = parse(input, index)) instanceof ParseError)) {
			values.push(output[0]);
			index = output[1];
		}

		if (output.index === index) {
			return [values, index];
		} else {
			return output;
		}
	},
	many1: parse => (input, index) => {
		const values = [];
		let output = parse(input, index);

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
	},
	try: parse => (input, index) => {
		const output = parse(input, index);

		if (output instanceof ParseError) {
			output.index = index;
		}

		return output;
	}
};

/**
 * Moon View Language Grammar
 */
const grammar = {
	comment: parser.type("comment", parser.sequence([
		parser.character("#"),
		parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["#"]))),
		parser.character("#")
	])),
	separator: (input, index) => parser.many(parser.or(
		parser.alternates([
			parser.character(" "),
			parser.character("\t"),
			parser.character("\n")
		]),
		grammar.comment
	))(input, index),
	identifierProperty: parser.and(
		parser.optional(parser.character(".")),
		parser.many1(parser.regex(identifierRE))
	),
	brackets: (input, index) => parser.sequence([
		parser.character("["),
		grammar.expression,
		parser.character("]")
	])(input, index),
	identifier: (input, index) => parser.type("identifier", parser.and(
		grammar.identifierProperty,
		parser.many(parser.or(
			grammar.identifierProperty,
			grammar.brackets
		))
	))(input, index),
	value: (input, index) => parser.alternates([
		grammar.identifier,
		parser.sequence([
			parser.character("\""),
			parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["\""]))),
			parser.character("\"")
		]),
		parser.sequence([
			parser.character("'"),
			parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["'"]))),
			parser.character("'")
		]),
		parser.sequence([
			parser.character("`"),
			parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["`"]))),
			parser.character("`")
		]),
		parser.sequence([
			parser.character("("),
			grammar.expression,
			parser.character(")")
		]),
		grammar.brackets,
		parser.sequence([
			parser.character("{"),
			grammar.expression,
			parser.character("}")
		])
	])(input, index),
	attributes: (input, index) => parser.type("attributes", parser.many(parser.sequence([
		grammar.value,
		parser.character("="),
		grammar.value,
		grammar.separator
	])))(input, index),
	text: parser.type("text", parser.many1(parser.or(
		parser.and(parser.character("\\"), parser.any),
		parser.not(["{", "<"])
	))),
	interpolation: (input, index) => parser.type("interpolation", parser.sequence([
		parser.character("{"),
		grammar.expression,
		parser.character("}")
	]))(input, index),
	node: (input, index) => parser.type("node", parser.sequence([
		parser.character("<"),
		grammar.separator,
		grammar.value,
		grammar.separator,
		parser.string("*>")
	]))(input, index),
	nodeData: (input, index) => parser.type("nodeData", parser.sequence([
		parser.character("<"),
		grammar.separator,
		grammar.value,
		grammar.separator,
		parser.or(parser.try(grammar.attributes), grammar.value),
		parser.string("/>")
	]))(input, index),
	nodeDataChildren: (input, index) => parser.type("nodeDataChildren", parser.sequence([
		parser.character("<"),
		grammar.separator,
		grammar.value,
		grammar.separator,
		grammar.attributes,
		parser.character(">"),
		parser.many(parser.alternates([
			parser.try(grammar.node),
			parser.try(grammar.nodeData),
			parser.try(grammar.nodeDataChildren),
			grammar.text,
			grammar.interpolation
		])),
		parser.string("</"),
		parser.many(parser.not([">"])),
		parser.character(">")
	]))(input, index),
	expression: (input, index) => parser.many(parser.alternates([
		// Single line comment
		parser.sequence([
			parser.string("//"),
			parser.many(parser.not(["\n"]))
		]),

		// Multi-line comment
		parser.sequence([
			parser.string("/*"),
			parser.many(parser.not(["*/"])),
			parser.string("*/")
		]),

		// Regular expression
		parser.try(parser.sequence([
			parser.character("/"),
			parser.many1(parser.or(
				parser.and(parser.character("\\"), parser.not(["\n"])),
				parser.not(["/", "\n"])
			)),
			parser.character("/")
		])),
		grammar.comment,
		grammar.value,
		parser.try(grammar.node),
		parser.try(grammar.nodeData),
		parser.try(grammar.nodeDataChildren),

		// Allow failed regular expression or view parses to be interpreted as
		// operators.
		parser.character("/"),
		parser.character("<"),

		// Anything up to a comment, regular expression, string, parenthetical,
		// array, object, or view. Only matches to the opening bracket of a view
		// because the view parsers do not require an expression to finish
		// parsing before consuming the closing bracket. Parentheticals, arrays,
		// and objects, however, parse expressions before their closing
		// delimiter, depending on the expression parser to stop before it.
		parser.many1(parser.not(["/", "#", "\"", "'", "`", "(", ")", "[", "]", "{", "}", "<"]))
	]))(input, index),
	main: (input, index) => parser.and(grammar.expression, parser.EOF)(input, index)
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

export default parse;
