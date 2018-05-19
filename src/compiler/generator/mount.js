import { directives } from "./directives";
import { appendChild, mapReduce } from "./util";

export const generateMount = (element, parent, root) => {
  switch (element.type) {
    case "m-expression":
    case "m-text":
      return appendChild(element.index, parent.index);
      break;
    default:
      const elementDirectives = element.directives;
      let code = appendChild(element.index, parent.index) + mapReduce(element.children, (child) => generateMount(child, element, root));
      
      for (let i = 0; i < elementDirectives.length; i++) {
        const elementDirective = elementDirectives[i];
        code = directives[elementDirective.key].mount(code, elementDirective, element, parent, root);
      }

      return code;
  }
};
