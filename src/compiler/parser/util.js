export { error } from "../../util/util";

export const whitespaceRE = /\s+/;

export const pushChild = (child, stack) => {
  stack[stack.length - 1].children.push(child);
};
