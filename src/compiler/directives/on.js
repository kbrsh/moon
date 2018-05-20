import { attributeValue, addEventListener } from "../generator/util";

export const mOn = {
  order: 0,
  create: (createCode, mountCode, directive, element) => {
    return [createCode + addEventListener(element.index, directive.argument, `function($event){${attributeValue(directive)}}`), mountCode];
  },
  update: (updateCode) => updateCode,
  destroy: (destroyCode) => destroyCode
};
