import { assignElement, attributeValue, addEventListener } from "./util";

export const directives = {
  "m-on": {
    create: (code, directive, element, parent, root) => {
      directive.on = root.nextIndex++;
      return code + addEventListener(element.index, directive.argument, `function($event){m[${directive.on}]($event);}`);
    },
    mount: (code) => code,
    update: (code, directive) => code + assignElement(directive.on, `function($event){${attributeValue(directive)};};`)
  }
};
