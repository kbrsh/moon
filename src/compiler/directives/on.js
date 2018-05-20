import { attributeValue, addEventListener } from "../generator/util";

export const mOn = {
  order: 0,
  create: (code, directive, element) => {
    return code + addEventListener(element.index, directive.argument, `function($event){${attributeValue(directive)}}`);
  },
  mount: (elementCode, childrenCode) => [elementCode, childrenCode],
  update: (code) => code
};
