const generateCreate = (element) => {
  if (Array.isArray(element)) {
    return element.map(generateCreate).join("");
  } else {
    switch (element.type) {
      case "m-text":
        return `m[${element.index}] = document.createTextNode("${element.content}");`;
        break;
      default:
        return element.children.map(generateCreate).join("") + `m[${element.index}] = document.createElement("${element.type}");`;
    }
  }
};

const generateMount = (element, parent) => {
  let generatedMount = "";

  if (Array.isArray(element)) {
    for (let i = 0; i < element.length; i++) {
      const child = element[i];
      const childPath = `m[${child.index}]`;

      if (child.type !== "m-text") {
        generatedMount += child.children.map((grandchild) => generateMount(grandchild, childPath)).join("");
      }

      generatedMount += `${parent}.parentNode.insertBefore(${childPath}, ${parent});`
    }
  } else {
    const elementPath = `m[${element.index}]`;

    if (element.type !== "m-text") {
      generatedMount += element.children.map((child) => generateMount(child, elementPath)).join("");
    }

    generatedMount += `${parent}.appendChild(${elementPath});`;
  }

  return generatedMount;
};

const generateUpdate = () => {};

export const generate = (tree) => {
  return new Function(`return [function () {var m = this.m;${generateCreate(tree)}}, function (root) {var m = this.m;${generateMount(tree, "root")}}, function () {var m = this.m;${generateUpdate(tree)}}]`)();
};
