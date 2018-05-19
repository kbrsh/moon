export const mapReduce = (arr, fn) => arr.reduce((result, current) => result + fn(current), "");

export const assignElement = (element, code) => `m[${element}]=${code}`;

export const attributeValue = (attribute) => attribute.expression ? attribute.value : `"${attribute.value}"`;

export const createElement = (type) => `m.ce("${type}");`;

export const createTextNode = (content) => `m.ctn(${content});`;

export const appendChild = (element, parent) => `m.ac(m[${element}],m[${parent}]);`;

export const removeChild = (element, parent) => `m.rc(m[${element}],m[${parent}]);`;

export const addEventListener = (element, type, handler) => `m.ael(m[${element}],"${type}",${handler});`;

export const setAttribute = (element, attribute) => `m.sa(m[${element}],"${attribute.key}",${attributeValue(attribute)});`;

export const setTextContent = (element, content) => `m.stc(m[${element}],${content});`;
