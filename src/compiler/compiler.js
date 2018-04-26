import { parse } from "./parser.js";
import { generate } from "./generator.js";

export const compile = (input) => {
  return generate(parse(input));
};
