import { mapReduce } from "./util";

const generateUpdateAttributes = (element) => mapReduce(element.attributes, (attribute) => {
  if (attribute.dynamic) {
    const key = attribute.key;

    switch (key) {
      case "m-for":
        break;
      case "m-if":
        break;
      case "m-on":
        return "";
        break;
      default:
        return `m[${element.index}].setAttribute("${key}",${attribute.value});`;
    }
  } else {
    return "";
  }
});

export const generateUpdate = (element) => {
  switch (element.type) {
    case "m-expression":
      return element.dynamic ? `m.ut(m[${element.index}],${element.content});` : "";
      break;
    case "m-text":
      return "";
      break;
    default:
      return generateUpdateAttributes(element) + mapReduce(element.children, generateUpdate);
  }
};
