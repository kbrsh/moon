import { mapReduce, setAttribute, setTextContent } from "./util";

export const generateUpdate = (element, parent, root) => {
  switch (element.type) {
    case "#text":
      const content = element.attributes[0];
      return content.dynamic ? setTextContent(element.index, content.value) : "";
      break;
    default:
      return mapReduce(element.attributes, (attribute) => {
        if (attribute.key[0] === "@" || !attribute.dynamic) {
          return "";
        } else {
          return setAttribute(element.index, attribute);
        }
      }) + mapReduce(element.children, (child) => generateUpdate(child, element, root));
  }
};
