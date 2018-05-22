import { mapReduce, getElement, setElement, createElement, createTextNode, createComment, attributeValue, setAttribute, addEventListener, appendChild, insertBefore } from "./util";

export const generateCreate = (element, parent, root, insert) => {
  let createCode;
  switch (element.type) {
    case "#if":
      const ifCreate = element.ifCreate = root.nextIndex++;
      return setElement(element.index, createComment()) + appendChild(element.index, parent.index) + setElement(ifCreate, `function(){${mapReduce(element.children, (child) => generateCreate(child, parent, root, element.index))}};`) + `if(${attributeValue(element.attributes[0])}){${getElement(ifCreate)}();}`;
      break;
    case "#else":
      const elseCreate = element.elseCreate = root.nextIndex++;
      return `else{${getElement(elseCreate)}();}${setElement(elseCreate, `function(){${mapReduce(element.children, (child) => generateCreate(child, parent, root, element.index - 1))}};`)}`;
    case "#text":
      createCode = setElement(element.index, createTextNode(attributeValue(element.attributes[0])));
      break;
    default:
      createCode = setElement(element.index, createElement(element.type)) + mapReduce(element.attributes, (attribute) => attribute.key[0] === "@" ? addEventListener(element.index, attribute) : setAttribute(element.index, attribute)) + mapReduce(element.children, (child) => generateCreate(child, element, root));
  }

  return createCode + (insert === undefined ? appendChild(element.index, parent.index) : insertBefore(element.index, insert, parent.index));
};
