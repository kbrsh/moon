import { mapReduce } from "../util/util";

const generateCreate = (element) => {
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

const generateMount = (element, parent) => {
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

const generateUpdate = (element) => {
  switch (element.type) {
    case "m-expression":
      return `m.ut(m[${element.index}], ${element.content});`
      break;
    case "m-text":
      return "";
      break;
    default:
      return mapReduce(element.children, generateUpdate);
  }
};

export const generate = (tree) => {
  return new Function(`return [function () {var m = this.m;${generateCreate(tree)}}, function (root) {var m = this.m;${generateMount(tree, "root")}}, function () {var m = this.m;${tree.dependencies.map((dependency) => `var ${dependency} = this.${dependency};`)}${generateUpdate(tree)}}]`)();
};
