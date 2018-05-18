import { directives } from "./directives";
import { attributeValue, mapReduce } from "./util";

export const generateCreate = (element, parent, root) => {
  switch (element.type) {
    case "m-fragment":
      return mapReduce(element.children, (child) => generateCreate(child, parent, root));
      break;
    case "m-expression":
      return `m[${element.index}]=m.ct("");`;
      break;
    case "m-text":
      return `m[${element.index}]=m.ct("${element.content}");`;
      break;
    default:
      const elementDirectives = element.directives;
      let code = `m[${element.index}]=m.ce("${element.type}");${mapReduce(element.attributes, (attribute) => attribute.dynamic ? "" : `m[${element.index}].setAttribute("${attribute.key}",${attributeValue(attribute)});`)}${mapReduce(element.children, (child) => generateCreate(child, `m[${element.index}]`, root))}`;

      for (let i = 0; i < elementDirectives.length; i++) {
        const elementDirective = elementDirectives[i];
        code = directives[elementDirective.key].create(code, elementDirective, element, parent, root);
      }

      return code;
  }
};
