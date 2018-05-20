import { components } from "../component/components";

const createElement = (type) => document.createElement(type);

const createTextNode = (content) => document.createTextNode(content);

const createComment = () => document.createComment("");

const appendChild = (element, parent) => {
  parent.appendChild(element);
};

const removeChild = (element, parent) => {
  parent.removeChild(element);
};

const insertNode = (element, reference, parent) => {
  parent.insertNode(element, reference);
};

const addEventListener = (element, type, handler) => {
  element.addEventListener(type, handler);
};

const setAttribute = (element, key, value) => {
  element.setAttribute(key, value);
};

const setTextContent = (element, content) => {
  element.textContent = content;
};

export const m = () => {
  let m = [];
  m.c = components;
  m.ce = createElement;
  m.ctn = createTextNode;
  m.cc = createComment;
  m.ac = appendChild;
  m.rc = removeChild;
  m.in = insertNode;
  m.ael = addEventListener;
  m.sa = setAttribute;
  m.stc = setTextContent;
  return m;
};
