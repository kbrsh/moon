import { generateDestroy } from "./destroy";
import { mapReduce, getElement, setElement, attributeValue, setAttribute, setTextContent } from "./util";

export const generateUpdate = (element, parent, root) => {
  switch (element.type) {
    case "#text": {
      const textAttribute = element.attributes[0];
      return textAttribute.dynamic ? setTextContent(element.index, textAttribute.value) : "";
    }
    case "#if": {
      const ifChild = element.children[0];
      return `
      if (${attributeValue(element.attributes[0])}) {
        if (${getElement(element.ifState)} === 0) {
          ${generateUpdate(ifChild, parent, root)}
        } else {
          ${generateDestroy(ifChild, parent, root)}
          ${element.ifCreate}
          ${setElement(element.ifState, "0")}
        }
      }
      `;
    }
    case "#else": {
      const ifChild = element.children[0];
      return `
      else {
        if (${getElement(element.ifState)} === 1) {
          ${generateUpdate(ifChild, parent, root)}
        } else {
          ${generateDestroy(ifChild, parent, root)}
          ${element.ifCreate}
          ${setElement(element.ifState, "1")}
        }
      }
      `;
    }
    default: {
      return mapReduce(element.attributes, (attribute) => {
        if (attribute.key[0] === "@" || !attribute.dynamic) {
          return "";
        } else {
          return setAttribute(element.index, attribute);
        }
      }) + mapReduce(element.children, (child) => generateUpdate(child, element, root));
    }
  }
};
