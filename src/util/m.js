import { components } from "../component/components";

const createElement = (type) => document.createElement(type);

const createTextNode = (content) => document.createTextNode(content);

const appendChild = (element, parent) => {
  parent.appendChild(element);
};

const replaceChild = (element, old, parent) => {
  parent.replaceChild(element, old);
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
  m.ac = appendChild;
  m.rc = replaceChild;
  m.ael = addEventListener;
  m.sa = setAttribute;
  m.stc = setTextContent;
  return m;
};
