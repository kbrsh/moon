import { directives } from "./directives";
import { mapReduce } from "./util";

export const generateMount = (element, parent, root) => {
  switch (element.type) {
    case "m-fragment":
      return mapReduce(element.children, (child) => generateMount(child, parent, root));
      break;
    case "m-expression":
    case "m-text":
      return `m.ac(m[${element.index}],m[${parent.index}]);`;
      break;
    default:
      const elementDirectives = element.directives;
      const elementCode = `m.ac(m[${element.index}],m[${parent.index}]);`;
      const childrenCode = mapReduce(element.children, (child) => generateMount(child, element, root));
      let code = elementCode + childrenCode;

      for (let i = 0; i < elementDirectives.length; i++) {
        const elementDirective = elementDirectives[i];
        const directive = directives[elementDirective.key];

        code = directive.mount(code, elementCode, childrenCode, elementDirective, element, parent, root);

        if (!elementDirective.dynamic) {
          code += directive.update("", "", "", elementDirective, element, parent, root);
        }
      }

      return code;
  }
};
