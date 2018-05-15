import { attributeValue } from "./util";

export const directives = {
  "m-on": {
    create: function(code, directive, element, parent, root) {
      directive.on = root.index++;
      return `${code}m[${element.index}].addEventListener("${directive.argument}",function(event){m[${directive.on}](event);});`;
    },
    update: function(code, directive) {
      return `${code}m[${directive.on}]=function(event){${attributeValue(directive)};};`;
    }
  }
};
