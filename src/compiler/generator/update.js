import { directives } from "./directives";
import { mapReduce } from "./util";

export const generateUpdate = (element, parent, root) => {
  switch (element.type) {
    case "m-fragment":
      return mapReduce(element.children, (child) => generateUpdate(child, parent, root));
      break;
    case "m-expression":
      return element.dynamic ? `m.stc(m[${element.index}],${element.content});` : "";
      break;
    case "m-text":
      return "";
      break;
    default:
      const elementDirectives = element.directives;
      const elementCode = mapReduce(element.attributes, (attribute) => attribute.dynamic ? `m.sa(m[${element.index}],"${attribute.key}",${attribute.value});` : "");
      const childrenCode = mapReduce(element.children, (child) => generateUpdate(child, element, root));
      let code = elementCode + childrenCode;

      for (let i = 0; i < elementDirectives.length; i++) {
        const elementDirective = elementDirectives[i];

        if (elementDirective.dynamic) {
          code = directives[elementDirective.key].update(code, elementCode, childrenCode, elementDirective, element, parent, root);
        }
      }

      return code;
  }
};
