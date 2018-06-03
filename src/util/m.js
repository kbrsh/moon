import { components } from "../component/components";

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

export const m = () => {
  return {
    c: components,
    ce: createElement,
    ctn: createTextNode,
    cc: createComment,
    sa: setAttribute,
    ael: addEventListener,
    stc: setTextContent,
    ac: appendChild,
    rc: removeChild,
    ib: insertBefore
  };
};
