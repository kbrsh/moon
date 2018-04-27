import {lex} from "./lexer.js";
import {parse} from "./parser.js";
import {generate} from "./generator.js";

export const compile = function(template) {
  return generate(parse(lex(template)));
}
