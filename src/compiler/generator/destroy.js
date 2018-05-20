import { directives } from "../directives/directives";
import { removeChild } from "./util";

export const generateDestroy = (element, parent, root) => {
  const elementDirectives = element.directives;
  let destroyCode = removeChild(element.index, parent.index);

  for (let i = 0; i < elementDirectives.length; i++) {
    const elementDirective = elementDirectives[i];
    destroyCode = directives[elementDirective.key].destroy(destroyCode, elementDirective, element, parent, root);
  }

  return destroyCode;
};
