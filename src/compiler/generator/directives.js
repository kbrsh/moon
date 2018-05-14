import { attributeValue } from "./util";

export const directives = {
  "m-on": {
    create: function(code, directive, element) {
      return `${code}m[${element.index}].addEventListener("${directive.argument}", function(event){${attributeValue(directive)};});`;
    },
    update: function() {}
  }
};
