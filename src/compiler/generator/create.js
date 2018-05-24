import { mapReduce, setElement, createElement, createTextNode, createComment, attributeValue, setAttribute, addEventListener, appendChild, insertBefore } from "./util";

const generateMount = (element, parent, insert) => insert === undefined ? appendChild(element, parent) : insertBefore(element, insert, parent);

export const generateCreate = (element, parent, root, insert) => {
  switch (element.type) {
    case "#if": {
      const siblings = parent.children;
      const nextSiblingIndex = siblings.indexOf(element) + 1;
      const nextSibling = siblings[nextSiblingIndex];

      element.ifReference = root.nextIndex++;
      element.ifState = root.nextIndex++;
      element.ifCreate = generateCreate(element.children[0], parent, root, element.ifReference);

      if (nextSibling !== undefined && nextSibling.type === "#else") {
        nextSibling.ifState = element.ifState;
        nextSibling.ifReference = element.ifReference;
      } else {
        siblings.splice(nextSiblingIndex, 0, {
          type: "#else",
          attributes: [],
          children: [{
            type: "#comment",
            attributes: [],
            children: []
          }],
          ifState: element.ifState,
          ifReference: element.ifReference
        });
      }

      return setElement(element.ifReference, createComment()) + generateMount(element.ifReference, parent.index, insert);
    }
    case "#else": {
      element.ifCreate = generateCreate(element.children[0], parent, root, element.ifReference);
      return "";
    }
    case "#comment": {
      element.commentElement = root.nextIndex++;
      return setElement(element.commentElement, createComment());
    }
    case "#text": {
      const textAttribute = element.attributes[0];
      element.textElement = root.nextIndex++;
      return setElement(element.textElement, createTextNode(textAttribute.dynamic ? "\"\"" : attributeValue(textAttribute))) + generateMount(element.textElement, parent.index, insert);
    }
    default: {
      return setElement(element.index, createElement(element.type)) + mapReduce(element.attributes, (attribute) => {
        if (attribute.key[0] === "@") {
          return addEventListener(element.index, attribute);
        } else if (attribute.dynamic) {
          return "";
        } else {
          return setAttribute(element.index, attribute);
        }
      }) + mapReduce(element.children, (child) => generateCreate(child, element, root)) + generateMount(element.index, parent.index, insert);
    }
  }
};
