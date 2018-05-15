import { directives } from "./directives";
import { attributeValue, mapReduce } from "./util";

export const generateCreate = (element, parent, root) => {
  switch (element.type) {
    case "m-fragment":
      return mapReduce(element.children, (child) => generateCreate(child, parent, root));
      break;
    case "m-expression":
      return `m[${element.index}]=m.ct("");m.ca(m[${element.index}],${parent});`;
      break;
    case "m-text":
      return `m[${element.index}]=m.ct("${element.content}");m.ca(m[${element.index}],${parent});`;
      break;
    default:
      const elementDirectives = element.directives;
      let code = `m[${element.index}]=m.ce("${element.type}");${mapReduce(element.attributes, (attribute) => `m[${element.index}].setAttribute("${attribute.key}",${attributeValue(attribute)});`)}m.ca(m[${element.index}], ${parent});${mapReduce(element.children, (child) => generateCreate(child, `m[${element.index}]`, root))}`;

      for (let i = 0; i < elementDirectives.length; i++) {
        const elementDirective = elementDirectives[i];
        const directive = directives[elementDirective.key];

        code = directive.create(code, elementDirective, element, parent, root);

        if (!elementDirective.dynamic) {
          code += directive.update("", elementDirective, element, parent, root);
        }
      }

      return code;
  }
};
