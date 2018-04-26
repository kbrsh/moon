import { parse } from "./parser";
import { generate } from "./generator";

export const compile = (input) => {
  return generate(parse(input));
};
