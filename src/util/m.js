import { components } from "../component/components";

const createElement = (type) => document.createElement(type);
const createTextNode = (content) => document.createTextNode(content);

const mountAppendChild = (element, parent) => {
  parent.appendChild(element);
};

const updateTextContent = (element, content) => {
  element.textContent = content;
};

export const m = () => {
  let m = [];
  m.c = components;
  m.ce = createElement;
  m.ct = createTextNode;
  m.ma = mountAppendChild;
  m.ut = updateTextContent;
  return m;
};
