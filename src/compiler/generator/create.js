import { directives } from "../directives/directives";
import { assignElement, attributeValue, createElement, createTextNode, createComment, appendChild, setAttribute, mapReduce } from "./util";

export const generateCreate = (element, parent, root) => {
  let createCode;
  let mountCode = appendChild(element.index, parent.index);

  switch (element.type) {
    case "m-comment":
      createCode = assignElement(element.index, createComment());
      break;
    case "m-text":
      createCode = assignElement(element.index, createTextNode(attributeValue(element.attributes[0])));
      break;
    default:
      createCode = assignElement(element.index, createElement(element.type)) + mapReduce(element.attributes, (attribute) => setAttribute(element.index, attribute)) + mapReduce(element.children, (child) => generateCreate(child, element, root));
  }

  const elementDirectives = element.directives;

  for (let i = 0; i < elementDirectives.length; i++) {
    const elementDirective = elementDirectives[i];
    const code = directives[elementDirective.key].create(createCode, mountCode, elementDirective, element, parent, root);
    createCode = code[0];
    mountCode = code[1];
  }

  return createCode + mountCode;
};
