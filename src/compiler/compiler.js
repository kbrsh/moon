import { parse } from "./parser/parser";
import { generate } from "./generator";

export const compile = (input) => {
  return generate(parse(input));
};
