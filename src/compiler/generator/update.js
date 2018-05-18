import { directives } from "./directives";
import { mapReduce } from "./util";

export const generateUpdate = (element, parent, root) => {
  switch (element.type) {
    case "m-fragment":
      return mapReduce(element.children, (child) => generateUpdate(child, parent, root));
      break;
    case "m-expression":
      return element.dynamic ? `m.ut(m[${element.index}],${element.content});` : "";
      break;
    case "m-text":
      return "";
      break;
    default:
      const elementDirectives = element.directives;
      let code = mapReduce(element.attributes, (attribute) => attribute.dynamic ? `m[${element.index}].setAttribute("${attribute.key}",${attribute.value});` : "") + mapReduce(element.children, (child) => generateUpdate(child, `m[${element.index}]`, root));

      for (let i = 0; i < elementDirectives.length; i++) {
        const elementDirective = elementDirectives[i];

        if (elementDirective.dynamic) {
          code = directives[elementDirective.key].update(code, elementDirective, element, parent, root);
        }
      }

      return code;
  }
};
