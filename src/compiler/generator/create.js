import { directives } from "./directives";
import { assignElement, createElement, createTextNode, setAttribute, mapReduce } from "./util";

export const generateCreate = (element, parent, root) => {
  switch (element.type) {
    case "m-expression":
      return assignElement(element.index, createTextNode("\"\""));
      break;
    case "m-text":
      return assignElement(element.index, createTextNode(`"${element.content}"`));
      break;
    default:
      const elementDirectives = element.directives;
      let code = assignElement(element.index, createElement(element.type) + mapReduce(element.attributes, (attribute) => attribute.dynamic ? "" : setAttribute(element.index, attribute)) + mapReduce(element.children, (child) => generateCreate(child, element, root)));

      for (let i = 0; i < elementDirectives.length; i++) {
        const elementDirective = elementDirectives[i];
        code = directives[elementDirective.key].create(code, elementDirective, element, parent, root);
      }

      return code;
  }
};
