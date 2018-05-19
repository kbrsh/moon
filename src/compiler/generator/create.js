import { directives } from "./directives";
import { attributeValue, mapReduce } from "./util";

export const generateCreate = (element, parent, root) => {
  switch (element.type) {
    case "m-fragment":
      return mapReduce(element.children, (child) => generateCreate(child, parent, root));
      break;
    case "m-expression":
      return `m[${element.index}]=m.ctn("");`;
      break;
    case "m-text":
      return `m[${element.index}]=m.ctn("${element.content}");`;
      break;
    default:
      const elementDirectives = element.directives;
      const elementCode = `m[${element.index}]=m.ce("${element.type}");${mapReduce(element.attributes, (attribute) => attribute.dynamic ? "" : `m.sa(m[${element.index}],"${attribute.key}",${attributeValue(attribute)})`)}`;
      const childrenCode = mapReduce(element.children, (child) => generateCreate(child, element, root));
      let code = elementCode + childrenCode;

      for (let i = 0; i < elementDirectives.length; i++) {
        const elementDirective = elementDirectives[i];
        code = directives[elementDirective.key].create(code, elementCode, childrenCode, elementDirective, element, parent, root);
      }

      return code;
  }
};
