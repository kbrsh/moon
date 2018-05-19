import { directives } from "./directives";
import { setAttribute, setTextContent, mapReduce } from "./util";

export const generateUpdate = (element, parent, root) => {
  switch (element.type) {
    case "m-expression":
      return element.dynamic ? setTextContent(element.index, element.content) : "";
      break;
    case "m-text":
      return "";
      break;
    default:
      const elementDirectives = element.directives;
      let code = mapReduce(element.attributes, (attribute) => attribute.dynamic ? setAttribute(element.index, attribute) : "") + mapReduce(element.children, (child) => generateUpdate(child, element, root));

      for (let i = 0; i < elementDirectives.length; i++) {
        const elementDirective = elementDirectives[i];
        code = directives[elementDirective.key].update(code, elementDirective, element, parent, root);
      }

      return code;
  }
};
