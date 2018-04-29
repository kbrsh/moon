const generateCreate = (element) => {
  switch (element.type) {
    case "m-fragment":
      return element.children.map(generateCreate).join("");
      break;
    case "m-expression":
      return `m[${element.index}] = document.createTextNode("");`;
      break;
    case "m-text":
      return `m[${element.index}] = document.createTextNode("${element.content}");`;
      break;
    default:
      return element.children.map(generateCreate).join("") + `m[${element.index}] = document.createElement("${element.type}");`;
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
          generatedMount += child.children.map((grandchild) => generateMount(grandchild, childPath)).join("");
        }

        generatedMount += `${parent}.parentNode.insertBefore(${childPath}, ${parent});`;
      }
      break;
    default:
      const elementPath = `m[${element.index}]`;

      if (element.type !== "m-text" && element.type !== "m-expression") {
        generatedMount += element.children.map((child) => generateMount(child, elementPath)).join("");
      }

      generatedMount += `${parent}.appendChild(${elementPath});`;
  }

  return generatedMount;
};

const generateUpdate = () => {};

export const generate = (tree) => {
  return new Function(`return [function () {var m = this.m;${generateCreate(tree)}}, function (root) {var m = this.m;${generateMount(tree, "root")}}, function () {var m = this.m;${tree.dependencies.map((dependency) => `var ${dependency} = this.${dependency};`)}${generateUpdate(tree)}}]`)();
};
