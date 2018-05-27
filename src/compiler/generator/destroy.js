import { getElement, removeChild } from "./util";

export const generateDestroy = (element, parent, root) => {
  switch (element.type) {
    case "#if": {
      return removeChild(element.ifReference, parent.index) + `if(${getElement(element.ifState)}===1){${getElement(element.elseDestroy)}();}`;
    }
    case "#else": {
      return `else{${getElement(element.ifDestroy)}();}`;
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
