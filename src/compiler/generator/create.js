import { mapReduce, getElement, setElement, createElement, createTextNode, createComment, attributeValue, setAttribute, addEventListener, appendChild, insertBefore } from "./util";

export const generateCreate = (element, index, parent, root, insert) => {
  let createCode;

  switch (element.type) {
    case "#if":
      const siblings = parent.children;
      let ifCreates = "";
      let ifBranches = "";

      for (let i = index; i < siblings.length;) {
        const sibling = siblings[i];
        const siblingType = sibling.type;
        const ifCreate = root.nextIndex++;
        let keyword;

        if (siblingType === "#if") {
          keyword = `if(${attributeValue(sibling.attributes[0])})`;
        } else if (siblingType === "#elseif") {
          keyword = `else if(${attributeValue(sibling.attributes[0])})`;
        } else if (siblingType === "#else") {
          keyword = "else";
        } else {
          break;
        }

        ifCreates += setElement(ifCreate, `function(){${mapReduce(sibling.children, (child, index) => generateCreate(child, index, parent, root, element.index))}};`);
        ifBranches += `${keyword}{${getElement(ifCreate)}();}`;
        siblings.splice(i, 1);
      }

      createCode = ifCreates + ifBranches + setElement(element.index, createComment());
      break;
    case "#text":
      createCode = setElement(element.index, createTextNode(attributeValue(element.attributes[0])));
      break;
    default:
      createCode = setElement(element.index, createElement(element.type)) + mapReduce(element.attributes, (attribute) => attribute.key[0] === "@" ? addEventListener(element.index, attribute) : setAttribute(element.index, attribute)) + mapReduce(element.children, (child, index) => generateCreate(child, index, element, root));
  }

  return createCode + (insert === undefined ? appendChild(element.index, parent.index) : insertBefore(element.index, insert, parent.index));
};
