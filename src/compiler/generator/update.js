import { directives } from "../directives/directives";
import { setAttribute, setTextContent, mapReduce } from "./util";

export const generateUpdate = (element, parent, root) => {
  let updateCode;

  switch (element.type) {
    case "m-comment":
      updateCode = "";
      break;
    case "m-text":
      const content = element.attributes[0];
      updateCode = content.dynamic ? setTextContent(element.index, content.value) : "";
      break;
    default:
      updateCode = mapReduce(element.attributes, (attribute) => attribute.dynamic ? setAttribute(element.index, attribute) : "") + mapReduce(element.children, (child) => generateUpdate(child, element, root));
  }

  const elementDirectives = element.directives;

  for (let i = 0; i < elementDirectives.length; i++) {
    const elementDirective = elementDirectives[i];
    updateCode = directives[elementDirective.key].update(updateCode, elementDirective, element, parent, root);
  }

  return updateCode;
};
