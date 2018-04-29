import { mapReduce } from "./util";

export const generateUpdate = (element) => {
  switch (element.type) {
    case "m-expression":
      return `m.ut(m[${element.index}], ${element.content});`;
      break;
    case "m-text":
      return "";
      break;
    default:
      return mapReduce(element.children, generateUpdate);
  }
};
