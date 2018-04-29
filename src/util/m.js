const createElement = (type) => document.createElement(type);
const createTextNode = (content) => document.createTextNode(content);

const mountAppendChild = (element, parent) => {
  parent.appendChild(element);
};

const updateTextContent = (element, content) => {
  element.textContent = content;
};

export const newM = () => {
  let m = [];
  m.ce = createElement;
  m.ct = createTextNode;
  m.ma = mountAppendChild;
  m.ut = updateTextContent;
  return m;
};
