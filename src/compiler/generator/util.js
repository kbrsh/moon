export const mapReduce = (arr, fn) => arr.reduce((result, current) => result + fn(current), "");

export const getElement = (element) => `m[${element}]`;

export const setElement = (element, code) => `${getElement(element)}=${code}`;

export const createElement = (type) => `m.ce("${type}");`;

export const createTextNode = (content) => `m.ctn(${content});`;

export const createComment = () => `m.cc();`;

export const attributeValue = (attribute) => attribute.expression ? attribute.value : `"${attribute.value}"`;

export const setAttribute = (element, attribute) => `m.sa(${getElement(element)},"${attribute.key}",${attributeValue(attribute)});`;

export const addEventListener = (element, attribute) => `m.ael(${getElement(element)},"${attribute.key.substring(1)}",function($event){${attributeValue(attribute)}});`;

export const setTextContent = (element, content) => `m.stc(${getElement(element)},${content});`;

export const appendChild = (element, parent) => `m.ac(${getElement(element)},${getElement(parent)});`;

export const removeChild = (element, parent) => `m.rc(${getElement(element)},${getElement(parent)});`;

export const replaceChild = (element, old, parent) => `m.pc(${getElement(element)},${getElement(old)},${getElement(parent)});`;
