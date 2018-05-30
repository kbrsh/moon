import { generateDestroy } from "./destroy";
import { mapReduce, getElement, setElement, createElement, createTextNode, createComment, attributeValue, setAttribute, addEventListener, appendChild, insertBefore } from "./util";

const generateMount = (element, parent, insert) => insert === undefined ? appendChild(element, parent) : insertBefore(element, insert, parent);

export const generateCreate = (element, parent, root, insert) => {
  switch (element.type) {
    case "#if": {
      const ifState = root.nextIndex++;
      element.ifReference = root.nextIndex++;
      let ifBlocks = "";

      const siblings = parent.children;
      for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i];
        if (sibling.type === "#if" || sibling.type === "#elseif" || sibling.type === "#else") {
          const children = sibling.children;
          let ifCreate = "";
          let ifDestroy = "";

          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            ifCreate += generateCreate(child, parent, root, element.ifReference);
            ifDestroy += generateDestroy(child, parent, root);
          }

          sibling.ifState = ifState;
          sibling.ifCreate = root.nextIndex++;
          sibling.ifDestroy = root.nextIndex++;

          ifBlocks += setElement(sibling.ifCreate, `function(){${ifCreate}};`) + setElement(sibling.ifDestroy, `function(){${ifDestroy}};`);
        }
      }

      return setElement(element.ifReference, createComment()) + generateMount(element.ifReference, parent.index, insert) + ifBlocks + `if(${attributeValue(element.attributes[0])}){${getElement(element.ifCreate)}();${setElement(element.ifState, getElement(element.ifDestroy))}}`;
    }
    case "#elseif": {
      return `else if(${attributeValue(element.attributes[0])}){${getElement(element.ifCreate)}();${setElement(element.ifState, getElement(element.ifDestroy))}}`;
    }
    case "#else": {
      return `else{${getElement(element.ifCreate)}();${setElement(element.ifState, getElement(element.ifDestroy))}}`;
    }
    case "#comment": {
      element.commentElement = root.nextIndex++;
      return setElement(element.commentElement, createComment()) + generateMount(element.commentElement, parent.index, insert);
    }
    case "#text": {
      const textAttribute = element.attributes[0];
      element.textElement = root.nextIndex++;
      return setElement(element.textElement, createTextNode(attributeValue(textAttribute))) + generateMount(element.textElement, parent.index, insert);
    }
    default: {
      return setElement(element.index, createElement(element.type)) + mapReduce(element.attributes, (attribute) => {
        if (attribute.key[0] === "@") {
          return addEventListener(element.index, attribute);
        } else {
          return setAttribute(element.index, attribute);
        }
      }) + mapReduce(element.children, (child) => generateCreate(child, element, root)) + generateMount(element.index, parent.index, insert);
    }
  }
};
