import { mapReduce, getElement, setElement, attributeValue, setAttribute, setTextContent } from "./util";

export const generateUpdate = (element, parent, root) => {
  switch (element.type) {
    case "#if": {
      return `if(${attributeValue(element.attributes[0])}){if(${getElement(element.ifState)}===${getElement(element.ifDestroy)}){${mapReduce(element.children, (child) => generateUpdate(child, parent, root))}}else{${getElement(element.ifState)}();${getElement(element.ifCreate)}();${setElement(element.ifState, getElement(element.ifDestroy))}}}`;
    }
    case "#elseif": {
      return `else if(${attributeValue(element.attributes[0])}){if(${getElement(element.ifState)}===${getElement(element.ifDestroy)}){${mapReduce(element.children, (child) => generateUpdate(child, parent, root))}}else{${getElement(element.ifState)}();${getElement(element.ifCreate)}();${setElement(element.ifState, getElement(element.ifDestroy))}}}`;
    }
    case "#else": {
      return `else{if(${getElement(element.ifState)}===${getElement(element.ifDestroy)}){${mapReduce(element.children, (child) => generateUpdate(child, parent, root))}}else{${getElement(element.ifState)}();${getElement(element.ifCreate)}();${setElement(element.ifState, getElement(element.ifDestroy))}}}`;
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
