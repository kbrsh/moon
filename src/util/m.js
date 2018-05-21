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

const replaceChild = (element, old, parent) => {
  parent.replaceChild(element, old);
};

export const m = () => {
  let m = [];
  m.c = components;
  m.ce = createElement;
  m.ctn = createTextNode;
  m.cc = createComment;
  m.sa = setAttribute;
  m.ael = addEventListener;
  m.stc = setTextContent;
  m.ac = appendChild;
  m.rc = removeChild;
  m.pc = replaceChild;
  return m;
};
