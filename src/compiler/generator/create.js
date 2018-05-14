import { attributeValue, mapReduce } from "./util";

const generateCreateAttributes = (element) => mapReduce(element.attributes, (attribute) => {
  const key = attribute.key;

  switch (key) {
    case "m-for":
      break;
    case "m-if":
      break;
    case "m-on":
      return `m[${element.index}].addEventListener("${attribute.argument}", function(event){${attributeValue(attribute)}});`;
      break;
    default:
      return `m[${element.index}].setAttribute("${key}",${attributeValue(attribute)});`;
  }
});

export const generateCreate = (element, parent) => {
  switch (element.type) {
    case "m-fragment":
      return mapReduce(element.children, (child) => generateCreate(child, parent));
      break;
    case "m-expression":
      return `m[${element.index}]=m.ct(${element.content});m.ca(m[${element.index}],${parent});`;
      break;
    case "m-text":
      return `m[${element.index}]=m.ct("${element.content}");m.ca(m[${element.index}],${parent});`;
      break;
    default:
      return `m[${element.index}]=m.ce("${element.type}");${generateCreateAttributes(element)}m.ca(m[${element.index}], ${parent});${mapReduce(element.children, (child) => generateCreate(child, `m[${element.index}]`))}`;
  }
};
