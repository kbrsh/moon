const parse = function(tokens) {
  let root = {
    type: "ROOT",
    props: {},
    children: []
  }
  let elements = [root];
  let lastIndex = 0;

  for(let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if(token.type === "Text") {
      // Push text to currently pending element
      elements[lastIndex].children.push({
        type: "#text",
        data: {
          flags: 0
        },
        value: token.value
      });
    } else if(token.type === "Tag") {
      // Tag found
      if(token.closeStart === true) {
        if("__ENV__" !== "production" && token.value !== elements[lastIndex].type) {
          error(`The element "${elements[lastIndex].type}" was left unclosed`);
        }
        // Closing tag found, close current element
        elements.pop();
        lastIndex--;
      } else {
        // Opening tag found, create element
        const type = token.value;
        const lastChildren = elements[lastIndex].children;
        const index = lastChildren.length;

        let node = {
          type: type,
          index: index,
          props: token.attributes,
          data: {
            flags: 0
          },
          children: []
        };

        lastChildren[index] = node;

        // Add to stack if element is a non void element
        if(token.closeEnd === false && VOID_ELEMENTS.indexOf(type) === -1) {
          elements.push(node);
          lastIndex++;
        }
      }
    }
  }

  if("__ENV__" !== "production" && root.children[0].type === "#text") {
    error("The root element cannot be text");
  }
  return root.children[0];
}
