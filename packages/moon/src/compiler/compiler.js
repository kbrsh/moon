import { lex } from "./lexer/lexer";
import { parse } from "./parser/parser";
import { generate } from "./generator/generator";

export function compile(input) {
	return generate(parse(lex(input)));
}
