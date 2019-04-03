import { lex } from "./lexer/lexer";
import { parse } from "./parser/parser";
import { generate } from "./generator/generator";

export function compile(input) {
	const tokens = lex(input);
	return parse(0, tokens.length, tokens);
}
