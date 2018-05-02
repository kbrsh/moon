export { error } from "../../util/util";

export const pushChild = (child, stack) => {
  stack[stack.length - 1].children.push(child);
};
