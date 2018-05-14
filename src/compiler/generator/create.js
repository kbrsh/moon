import { directives } from "./directives";
import { attributeValue, mapReduce } from "./util";

export const generateCreate = (element, parent) => {
  switch (element.type) {
    case "m-fragment":
      return mapReduce(element.children, (child) => generateCreate(child, parent));
      break;
    case "m-expression":
      return `m[${element.index}]=m.ct(${element.content});m.ca(m[${element.index}],${parent});`;
      break;
    case "m-text":
      return `m[${element.index}]=m.ct("${element.content}");m.ca(m[${element.index}],${parent});`;
      break;
    default:
      const elementDirectives = element.directives;
      let code = `m[${element.index}]=m.ce("${element.type}");${mapReduce(element.attributes, (attribute) => `m[${element.index}].setAttribute("${attribute.key}",${attributeValue(attribute)});`)}m.ca(m[${element.index}], ${parent});${mapReduce(element.children, (child) => generateCreate(child, `m[${element.index}]`))}`;

      for (let i = 0; i < elementDirectives.length; i++) {
        const elementDirective = elementDirectives[i];
        code = directives[elementDirective.key].create(code, elementDirective, element, parent);
      }

      return code;
  }
};
