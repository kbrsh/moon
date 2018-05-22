import { parseTemplate } from "./template";
import { whitespaceRE, error, pushChild } from "./util";

const parseAttributes = (index, input, length, dependencies, attributes) => {
  while (index < length) {
    let char = input[index];

    if (char === "/" || char === ">") {
      break;
    } else if (whitespaceRE.test(char)) {
      index += 1;
      continue;
    } else {
      let key = "";
      let value = "";
      let expression = false;

      while (index < length) {
        char = input[index];

        if (char === "/" || char === ">" || whitespaceRE.test(char)) {
          value = key;
          break;
        } else if (char === "=") {
          index += 1;
          break;
        } else {
          key += char;
          index += 1;
        }
      }

      if (value.length === 0) {
        let quote;
        char = input[index];

        if (char === "\"" || char === "'") {
          quote = char;
          index += 1;
        } else if (char === "{") {
          quote = "}";
          expression = true;
          index += 1;
        } else {
          quote = whitespaceRE;
        }

        while (index < length) {
          char = input[index];

          if (char === "/" || char === ">") {
            break;
          } else if ((typeof quote === "object" && quote.test(char)) || char === quote) {
            index += 1;
            break;
          } else {
            value += char;
            index += 1;
          }
        }
      }

      attributes.push({
        key: key,
        value: value,
        expression: expression,
        dynamic: expression && parseTemplate(value, dependencies)
      });
    }
  }

  return index;
};

export const parseOpeningTag = (index, input, length, stack, dependencies) => {
  let element = {
    index: stack[0].nextIndex++,
    type: "",
    attributes: [],
    children: []
  };

  while (index < length) {
    const char = input[index];

    if (char === ">") {
      const attributes = element.attributes;
      for (let i = 0; i < attributes.length;) {
        const attribute = attributes[i];
        if (attribute.key[0] === "#") {
          element = {
            index: stack[0].nextIndex++,
            type: attribute.key,
            attributes: [{
              key: "",
              value: attribute.value,
              expression: attribute.expression,
              dynamic: attribute.dynamic
            }],
            children: [element]
          };
          pushChild(element, stack);
          attributes.splice(i, 1);
        } else {
          i += 1;
        }
      }

      pushChild(element, stack);
      stack.push(element);

      index += 1;
      break;
    } else if (char === "/" && input[index + 1] === ">") {
      pushChild(element, stack);

      index += 2;
      break;
    } else if ((whitespaceRE.test(char) && (index += 1)) || char === "=") {
      index = parseAttributes(index, input, length, dependencies, element.attributes);
    } else {
      element.type += char;
      index += 1;
    }
  }

  return index;
};

export const parseClosingTag = (index, input, length, stack) => {
  let type = "";

  for(; index < length; index++) {
    const char = input[index];

    if (char === ">") {
      index += 1;
      break;
    } else {
      type += char;
    }
  }

  const lastElement = stack.pop();
  if (type !== lastElement.type && process.env.MOON_ENV === "development") {
    error(`Unclosed tag "${lastElement.type}"`);
  }

  return index;
};
