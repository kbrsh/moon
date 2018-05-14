import { mapReduce } from "./util";

export const generateUpdate = (element) => {
  switch (element.type) {
    case "m-expression":
      return element.dynamic ? `m.ut(m[${element.index}],${element.content});` : "";
      break;
    case "m-text":
      return "";
      break;
    default:
      return mapReduce(element.attributes, (attribute) => attribute.dynamic ? `m[${element.index}].setAttribute("${attribute.key}",${attribute.value});` : "") + mapReduce(element.children, generateUpdate);
  }
};
