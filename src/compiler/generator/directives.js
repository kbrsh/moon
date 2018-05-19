import { attributeValue } from "./util";

export const directives = {
  "m-on": {
    create: function(code, elementCode, childrenCode, directive, element, parent, root) {
      directive.on = root.nextIndex++;
      return `${code}m.ael(m[${element.index}],"${directive.argument}",function($event){m[${directive.on}]($event);});`;
    },
    mount: function(code) {
      return code;
    },
    update: function(code, elementCode, childrenCode, directive) {
      return `${code}m[${directive.on}]=function($event){${attributeValue(directive)};};`;
    }
  }
};
