const generateCreateFragment = (element) => {
  return `${element.children.map(generateCreate)} m[${element.index}] = []; `;
};

const generateCreateText = (element) => {};

const generateCreateElement = (element) => {
  return ` m[${element.index}] = document.createElement("${element.type}");`;
};

const generateCreate = (element) => {
  switch (element.type) {
    case "m-fragment":
      return generateCreateFragment(element);
      break;
    case "m-text":
      return generateCreateText(element);
      break;
    default:
      return generateCreateElement(element);
  }
};

const generateUpdate = () => {};

export const generate = (tree) => {
  const prelude = `var data = instance.data; var m = instance.m;`;
  return new Function(`return [function (instance) {${prelude}${generateCreate(tree)}}, function (instance) {${prelude}${generateUpdate(tree)}}]`)();
};
