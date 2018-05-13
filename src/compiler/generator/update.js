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
      const elementPath = `m[${element.index}]`;
      return mapReduce(element.attributes, (attribute) => attribute.dynamic ? `${elementPath}.setAttribute("${attribute.key}",${attribute.value});` : "") + mapReduce(element.children, generateUpdate);
  }
};
