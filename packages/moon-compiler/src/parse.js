/**
 * Matches an identifier character.
 */
const identifierRE = /[@$\w.?]/;

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
		return index === input.length ?
			["EOF", index] :
			new ParseError("EOF", index);
	},
	empty: (input, index) => ["", index],
	any: (input, index) => {
		return index < input.length ?
			[input[index], index + 1] :
			new ParseError("any", index);
	},
	character: character => (input, index) => {
		const head = input[index];

		return head === character ?
			[head, index + 1] :
			new ParseError(`"${character}"`, index);
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
			new ParseError(`"${string}"`, index);
	},
	not: strings => (input, index) => {
		if (index < input.length) {
			for (let i = 0; i < strings.length; i++) {
				const string = strings[i];

				if (input.slice(index, index + string.length) === string) {
					return new ParseError(`not "${string}"`, index);
				}
			}

			return [input[index], index + 1];
		} else {
			return new ParseError(`not ${strings.map(JSON.stringify).join(", ")}`, index);
		}
	},
	or: (parse1, parse2) => (input, index) => {
		const output1 = parse1(input, index);

		if (output1 instanceof ParseError) {
			const output2 = parse2(input, index);

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
		let alternatesError = new ParseError("alternates", -1);

		for (let i = 0; i < parses.length; i++) {
			const output = parses[i](input, index);

			if (output instanceof ParseError) {
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

		return [values, index];
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

		return [values, index];
	}
};

/**
 * Moon View Language Grammar
 */
const grammar = {
	whitespace: parser.alternates([parser.character(" "), parser.character("\t"), parser.character("\n")]),
	whitespaces: (input, index) => parser.many(grammar.whitespace)(input, index),
	identifier: parser.many1(parser.regex(identifierRE)),
	string: parser.alternates([
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
		])
	]),
	block: (input, index) => parser.type("block", parser.sequence([
		parser.character("{"),
		grammar.expression,
		parser.character("}")
	]))(input, index),
	value: (input, index) => parser.alternates([grammar.string, grammar.block, grammar.identifier])(input, index),
	text: parser.type("text", parser.many1(parser.not(["{", "<"]))),
	attributes: (input, index) => parser.type("attributes", parser.many(parser.sequence([
		grammar.identifier,
		parser.character("="),
		grammar.value,
		grammar.whitespaces
	])))(input, index),
	node: (input, index) => parser.type("node", parser.sequence([
		parser.character("<"),
		grammar.whitespaces,
		grammar.value,
		grammar.whitespaces,
		parser.string("#>")
	]))(input, index),
	nodeData: (input, index) => parser.type("nodeData", parser.sequence([
		parser.character("<"),
		grammar.whitespaces,
		grammar.value,
		grammar.whitespaces,
		parser.or(grammar.block, grammar.attributes),
		parser.string("/>")
	]))(input, index),
	nodeDataChildren: (input, index) => parser.type("nodeDataChildren", parser.sequence([
		parser.character("<"),
		grammar.whitespaces,
		grammar.value,
		grammar.whitespaces,
		grammar.attributes,
		parser.character(">"),
		parser.many(parser.alternates([
			grammar.node,
			grammar.nodeData,
			grammar.nodeDataChildren,
			grammar.block,
			grammar.text
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
		parser.sequence([
			parser.character("/"),
			parser.many1(parser.or(
				parser.and(parser.character("\\"), parser.not(["\n"])),
				parser.not(["/", "\n"])
			)),
			parser.character("/")
		]),
		grammar.block,
		grammar.string,
		grammar.node,
		grammar.nodeData,
		grammar.nodeDataChildren,

		// Anything up to a comment, regular expression, block, view, or string.
		// Allow failed regular expression or view parses to be interpreted as
		// operators.
		parser.and(
			parser.alternates([parser.character("/"), parser.character("<"), parser.empty]),
			parser.many1(parser.not(["/", "{", "}", "<", "\"", "'", "`"]))
		),
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
 * @returns {Object} abstract syntax tree and end index or ParseError
 */
function parse(input) {
	return grammar.main(input, 0);
}

parse.Error = ParseError;

export default parse;
