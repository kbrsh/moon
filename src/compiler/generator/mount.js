import { directives } from "./directives";
import { mapReduce } from "./util";

export const generateMount = (element, parent, root) => {
  switch (element.type) {
    case "m-fragment":
      return mapReduce(element.children, (child) => generateMount(child, parent, root));
      break;
    case "m-expression":
    case "m-text":
      return `m.ca(m[${element.index}],${parent});`;
      break;
    default:
      const elementDirectives = element.directives;
      let code = `m.ca(m[${element.index}], ${parent});${mapReduce(element.children, (child) => generateMount(child, `m[${element.index}]`, root))}`;

      for (let i = 0; i < elementDirectives.length; i++) {
        const elementDirective = elementDirectives[i];
        const directive = directives[elementDirective.key];

        code = directive.mount(code, elementDirective, element, parent, root);

        if (!elementDirective.dynamic) {
          code += directive.update("", elementDirective, element, parent, root);
        }
      }

      return code;
  }
};
