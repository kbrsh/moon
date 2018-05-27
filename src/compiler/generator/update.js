import { mapReduce, getElement, setElement, attributeValue, setAttribute, setTextContent } from "./util";

export const generateUpdate = (element, parent, root) => {
  switch (element.type) {
    case "#if": {
      return `if(${attributeValue(element.attributes[0])}){if(${getElement(element.ifState)}===0){${mapReduce(element.children, (child) => generateUpdate(child, parent, root))}}else{${getElement(element.elseDestroy)}();${getElement(element.ifCreate)}();${setElement(element.ifState, "0;")}}}`;
    }
    case "#else": {
      return `else{if(${getElement(element.ifState)}===1){${mapReduce(element.children, (child) => generateUpdate(child, parent, root))}}else{${getElement(element.ifDestroy)}();${getElement(element.elseCreate)}();${setElement(element.ifState, "1;")}}}`;
    }
    case "#text": {
      const textAttribute = element.attributes[0];
      return textAttribute.dynamic ? setTextContent(element.textElement, textAttribute.value) : "";
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
