const generateCreateText = (element) => {
  return `m[${element.index}] = document.createTextNode("");`;
};

const generateCreateElement = (element) => {
  return `m[${element.index}] = document.createElement("${element.type}");`;
};

const generateCreate = (element) => {
  if (Array.isArray(element)) {
    return element.map(generateCreate);
  } else {
    switch (element.type) {
      case "m-text":
        return generateCreateText(element);
        break;
      default:
        return element.children.map(generateCreate) + generateCreateElement(element);
    }
  }
};

const generateMount = () => {
  
};

const generateUpdate = () => {};

export const generate = (tree) => {
  return new Function(`return [function () {var m = this.m;${generateCreate(tree)}}, function (root) {var m = this.m;${generateMount(tree)}}, function () {var m = this.m;${generateUpdate(tree)}}]`)();
};
