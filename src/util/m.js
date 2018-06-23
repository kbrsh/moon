const createElement = (type) => document.createElement(type);

const createTextNode = (content) => document.createTextNode(content);

const createComment = () => document.createComment("");

const setAttribute = (element, key, value) => {
  element.setAttribute(key, value);
};

const addEventListener = (element, type, handler) => {
  element.addEventListener(type, handler);
};

const setTextContent = (element, content) => {
  element.textContent = content;
};

const appendChild = (element, parent) => {
  parent.appendChild(element);
};

const removeChild = (element, parent) => {
  parent.removeChild(element);
};

const insertBefore = (element, reference, parent) => {
  parent.insertBefore(element, reference);
};

const directiveIf = (ifState, ifReference, ifConditions, ifPortions, ifParent) => {
  for (let i = 0; i < ifConditions.length; i++) {
    if (ifConditions[i]) {
      const ifPortion = ifPortions[i];

      if (ifState === ifPortion) {
        ifPortion[1]();
      } else {
        if (ifState) {
          ifState[2]();
        }

        ifPortion[0](ifParent);
        ifPortion[1]();

        ifState = ifPortion;
      }

      return ifState;
    }
  }
};

export const m = {
  ce: createElement,
  ctn: createTextNode,
  cc: createComment,
  sa: setAttribute,
  ael: addEventListener,
  stc: setTextContent,
  ac: appendChild,
  rc: removeChild,
  ib: insertBefore,
  di: directiveIf
};
