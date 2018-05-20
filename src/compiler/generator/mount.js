import { directives } from "../directives/directives";
import { appendChild, mapReduce } from "./util";

export const generateMount = (element, parent, root) => {
  switch (element.type) {
    case "m-expression":
    case "m-text":
      return appendChild(element.index, parent.index);
      break;
    default:
      const elementDirectives = element.directives;
      let elementCode = appendChild(element.index, parent.index);
      let childrenCode = mapReduce(element.children, (child) => generateMount(child, element, root));

      for (let i = 0; i < elementDirectives.length; i++) {
        const elementDirective = elementDirectives[i];
        const code = directives[elementDirective.key].mount(elementCode, childrenCode, elementDirective, element, parent, root);
        elementCode = code[0];
        childrenCode = code[1];
      }

      return elementCode + childrenCode;
  }
};
