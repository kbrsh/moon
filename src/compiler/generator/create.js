import { mapReduce } from "./util";

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
      return `${mapReduce(element.children, generateCreate)}${elementPath} = m.ce("${element.type}");${mapReduce(element.attributes, (attribute) => `${elementPath}.setAttribute("${attribute.key}", ${attribute.expression ? attribute.value : `"${attribute.value}"`});`)}`;
  }
};
