const mapReduce = (arr, fn) => arr.reduce((result, current) => result + fn(current), "");

const generateCreate = (element) => {
  switch (element.type) {
    case "m-fragment":
      return mapReduce(element.children, generateCreate);
      break;
    case "m-expression":
      return `m[${element.index}] = document.createTextNode("");`;
      break;
    case "m-text":
      return `m[${element.index}] = document.createTextNode("${element.content}");`;
      break;
    default:
      return `${mapReduce(element.children, generateCreate)}m[${element.index}] = document.createElement("${element.type}");`;
  }
};

const generateMount = (element, parent) => {
  let generatedMount = "";

  switch (element.type) {
    case "m-fragment":
      const children = element.children;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const childPath = `m[${child.index}]`;

        if (child.type !== "m-text") {
          generatedMount += mapReduce(child.children, (grandchild) => generateMount(grandchild, childPath));
        }

        generatedMount += `${parent}.parentNode.insertBefore(${childPath}, ${parent});`;
      }
      break;
    default:
      const elementPath = `m[${element.index}]`;

      if (element.type !== "m-text" && element.type !== "m-expression") {
        generatedMount += mapReduce(element.children, (child) => generateMount(child, elementPath));
      }

      generatedMount += `${parent}.appendChild(${elementPath});`;
  }

  return generatedMount;
};

const generateUpdate = (element) => {
  switch (element.type) {
    case "m-expression":
      return `m[${element.index}].textContent = ${element.content};`;
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
