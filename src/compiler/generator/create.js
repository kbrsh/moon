import { mapReduce, getElement, setElement, createElement, createTextNode, createComment, attributeValue, setAttribute, addEventListener, appendChild, insertBefore } from "./util";

export const generateCreate = (element, index, parent, root, insert) => {
  let createCode, mountCode = "", mountElement = element.index;

  switch (element.type) {
    case "#if":
      const siblings = parent.children;
      const ifReference = root.nextIndex++;
      let ifCreates = "";
      let ifBranches = "";

      for (let i = index; i < siblings.length;) {
        const sibling = siblings[i];
        let keyword;

        if (sibling.type === "#if") {
          keyword = `if(${attributeValue(sibling.attributes[0])})`;
        } else if (sibling.type === "#elseif") {
          keyword = `else if(${attributeValue(sibling.attributes[0])})`;
        } else if (sibling.type === "#else") {
          keyword = "else";
        } else {
          break;
        }

        ifCreates += setElement(sibling.index, `function(){${mapReduce(sibling.children, (child, index) => generateCreate(child, index, parent, root, ifReference))}};`);
        ifBranches += `${keyword}{${getElement(sibling.index)}();}`;
        siblings.splice(i, 1);
      }

      createCode = setElement(ifReference, createComment());
      mountCode = ifCreates + ifBranches;
      mountElement = ifReference;
      break;
    case "#text":
      createCode = setElement(mountElement, createTextNode(attributeValue(element.attributes[0])));
      break;
    default:
      createCode = setElement(mountElement, createElement(element.type)) + mapReduce(element.attributes, (attribute) => attribute.key[0] === "@" ? addEventListener(mountElement, attribute) : setAttribute(mountElement, attribute)) + mapReduce(element.children, (child, index) => generateCreate(child, index, element, root));
  }

  return createCode + (insert === undefined ? appendChild(mountElement, parent.index) : insertBefore(mountElement, insert, parent.index)) + mountCode;
};
