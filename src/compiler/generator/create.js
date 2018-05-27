import { generateDestroy } from "./destroy";
import { mapReduce, getElement, setElement, createElement, createTextNode, createComment, attributeValue, setAttribute, addEventListener, appendChild, insertBefore } from "./util";

const generateMount = (element, parent, insert) => insert === undefined ? appendChild(element, parent) : insertBefore(element, insert, parent);

export const generateCreate = (element, parent, root, insert) => {
  switch (element.type) {
    case "#if": {
      const siblings = parent.children;
      const nextSiblingIndex = siblings.indexOf(element) + 1;
      let nextSibling = siblings[nextSiblingIndex];

      element.ifReference = root.nextIndex++;
      element.ifState = root.nextIndex++;
      element.ifCreate = root.nextIndex++;
      element.elseDestroy = root.nextIndex++;

      if (nextSibling !== undefined && nextSibling.type === "#else") {
        nextSibling.ifState = element.ifState;
        nextSibling.elseCreate = root.nextIndex++;
        nextSibling.ifDestroy = root.nextIndex++;
      } else {
        nextSibling = {
          type: "#else",
          attributes: [],
          children: [],
          ifState: element.ifState,
          elseCreate: root.nextIndex++,
          ifDestroy: root.nextIndex++
        };

        siblings.splice(nextSiblingIndex, 0, nextSibling);
      }

      let ifCreate = "";
      let ifDestroy = "";
      let elseCreate = "";
      let elseDestroy = "";

      const elementChildren = element.children;
      for (let i = 0; i < elementChildren.length; i++) {
        const child = elementChildren[i];
        ifCreate += generateCreate(child, parent, root, element.ifReference);
        ifDestroy += generateDestroy(child, parent, root);
      }

      const nextSiblingChildren = nextSibling.children;
      for (let i = 0; i < nextSiblingChildren.length; i++) {
        const child = nextSiblingChildren[i];
        elseCreate += generateCreate(child, parent, root, element.ifReference);
        elseDestroy += generateDestroy(child, parent, root);
      }

      return setElement(element.ifReference, createComment()) + generateMount(element.ifReference, parent.index, insert) + setElement(element.ifCreate, `function(){${ifCreate}};`) + setElement(nextSibling.ifDestroy, `function(){${ifDestroy}};`) + setElement(nextSibling.elseCreate, `function(){${elseCreate}};`) + setElement(element.elseDestroy, `function(){${elseDestroy}};`) + `if(${attributeValue(element.attributes[0])}){${getElement(element.ifCreate)}();${setElement(element.ifState, "0;")}}`;
    }
    case "#else": {
      return `else{${getElement(element.elseCreate)}();${setElement(element.ifState, "1;")}}`;
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
