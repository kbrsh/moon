import { components } from "../component/components";

const createElement = (type) => document.createElement(type);
const createText = (content) => document.createTextNode(content);
const createAddEvent = (element, type, handler) => {
  element.addEventListener(type, handler);
};
const createAppend = (element, parent) => {
  parent.appendChild(element);
};

const updateText = (element, content) => {
  element.textContent = content;
};

export const m = () => {
  let m = [];
  m.c = components;
  m.ce = createElement;
  m.ct = createText;
  m.cae = createAddEvent;
  m.ca = createAppend;
  m.ut = updateText;
  return m;
};
