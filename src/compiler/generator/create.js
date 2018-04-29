import { mapReduce } from "./util";

export const generateCreate = (element) => {
  switch (element.type) {
    case "m-fragment":
      return mapReduce(element.children, generateCreate);
      break;
    case "m-expression":
      return `m[${element.index}] = m.ct("");`;
      break;
    case "m-text":
      return `m[${element.index}] = m.ct("${element.content}");`;
      break;
    default:
      return `${mapReduce(element.children, generateCreate)}m[${element.index}] = m.ce("${element.type}");`;
  }
};
