import { removeChild } from "./util";

export const generateDestroy = (element, parent, root) => {
  switch (element.type) {
    case "#if": {
      return removeChild(element.ifReference, parent.index) + generateDestroy(element.children[0], parent, root);
    }
    case "#comment": {
      return removeChild(element.commentElement, parent.index);
    }
    case "#text": {
      return removeChild(element.textElement, parent.index);
    }
    default: {
      return removeChild(element.index, parent.index);
    }
  }
};
