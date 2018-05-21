import { mapReduce, setElement, createElement, createTextNode, attributeValue, setAttribute, addEventListener, appendChild } from "./util";

export const generateCreate = (element, parent, root) => {
  switch (element.type) {
    case "#text":
      return setElement(element.index, createTextNode(attributeValue(element.attributes[0]))) + appendChild(element.index, parent.index);
      break;
    default:
      return setElement(element.index, createElement(element.type)) + mapReduce(element.attributes, (attribute) => attribute.key[0] === "@" ? addEventListener(element.index, attribute) : setAttribute(element.index, attribute)) + mapReduce(element.children, (child) => generateCreate(child, element, root)) + appendChild(element.index, parent.index);
  }
};
