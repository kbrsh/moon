import { mapReduce } from "./util";

export const generateMount = (element, parent) => {
  let generatedMount = "";

  switch (element.type) {
    case "m-fragment":
      return mapReduce(element.children, (child) => generateMount(child, parent));
      break;
    default:
      const elementPath = `m[${element.index}]`;

      if (element.type !== "m-text" && element.type !== "m-expression") {
        generatedMount += mapReduce(element.children, (child) => generateMount(child, elementPath));
      }

      generatedMount += `m.ma(${elementPath}, ${parent});`;
  }

  return generatedMount;
};
