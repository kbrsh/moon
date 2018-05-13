import { mapReduce } from "./util";

const generateCreateAttribute = (attribute, element) => {
  return `${element}.setAttribute("${attribute.key}", ${attribute.literal ? attribute.value : `"${attribute.value}"`});`;
};

export const generateCreate = (element) => {
  switch (element.type) {
    case "m-fragment":
      return mapReduce(element.children, generateCreate);
      break;
    case "m-expression":
      return `m[${element.index}] = m.ct(${element.content});`;
      break;
    case "m-text":
      return `m[${element.index}] = m.ct("${element.content}");`;
      break;
    default:
      const elementPath = `m[${element.index}]`;
      return `${mapReduce(element.children, generateCreate)}${elementPath} = m.ce("${element.type}");${mapReduce(element.attributes, (attribute) => generateCreateAttribute(attribute, elementPath))}`;
  }
};
