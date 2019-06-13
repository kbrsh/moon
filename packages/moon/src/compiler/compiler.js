import { lex } from "./lexer/lexer";
import { parse } from "./parser/parser";
import { generate } from "./generator/generator";

/**
 * Compiles an input into a function that returns a Moon view node.
 *
 * @param {string} input
 * @returns {string} view function code
 */
export function compile(input) {
	return generate(parse(lex(input)));
}
