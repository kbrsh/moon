const lex = function(template) {
  const length = template.length;
  let tokens = [];
  let current = 0;

  while(current < length) {
    let char = template[current];
    if(char === '<') {
      current++;
      if(template.substring(current, current + 3) === "!--") {
        // Comment
        current += 3;
        const endOfComment = template.indexOf("-->", current);
        if(endOfComment === -1) {
          current = length;
        } else {
          current = endOfComment + 3;
        }
      } else {
        // Tag
        let tagToken = {
          type: "Tag",
          value: ''
        }

        let tagType = '';
        let attributes = [];

        let closeStart = false;
        let closeEnd = false;

        char = template[current];

        // Exit starting closing slash
        if(char === '/') {
          char = template[++current];
          closeStart = true;
        }

        // Get tag name
        while((current < length) && ((char !== '>') && (char !== '/') && (whitespaceCharRE.test(char) === false))) {
          tagType += char;
          char = template[++current];
        }

        // Iterate to end of tag
        while((current < length) && ((char !== '>') && (char !== '/' || template[current + 1] !== '>'))) {
          if(whitespaceCharRE.test(char) === true) {
            // Skip whitespace
            char = template[++current];
          } else {
            // Find attribute name
            let attrName = '';
            let attrValue = '';
            while((current < length) && ((char !== '=') && (whitespaceCharRE.test(char) === false) && ((char !== '>') && (char !== '/' || template[current + 1] !== '>')))) {
              attrName += char;
              char = template[++current];
            }

            // Find attribute value
            if(char === '=') {
              char = template[++current];

              let quoteType = ' ';
              if(char === '"' || char === '\'' || char === ' ' || char === '\n') {
                quoteType = char;
                char = template[++current];
              }

              // Iterate to end of quote type, or end of tag
              while((current < length) && ((char !== '>') && (char !== '/' || template[current + 1] !== '>'))) {
                if(char === quoteType) {
                  char = template[++current];
                  break;
                } else {
                  attrValue += char;
                  char = template[++current];
                }
              }
            }

            attrName = attrName.split(':');
            attributes.push({
              name: attrName[0],
              value: attrValue,
              argument: attrName[1],
              data: {}
            });
          }
        }

        if(char === '/') {
          current += 2;
          closeEnd = true;
        } else {
          current++;
        }

        tagToken.value = tagType;
        tagToken.attributes = attributes;
        tagToken.closeStart = closeStart;
        tagToken.closeEnd = closeEnd;
        tokens.push(tagToken);
      }
    } else {
      // Text
      const textTail = template.substring(current);
      const endOfText = textTail.search(tagOrCommentStartRE);
      let text;
      if(endOfText === -1) {
        text = textTail;
        current = length;
      } else {
        text = textTail.substring(0, endOfText);
        current += endOfText;
      }
      if(trimWhitespace(text).length !== 0) {
        tokens.push({
          type: "Text",
          value: text.replace(escapeRE, function(match) {
            return escapeMap[match];
          })
        });
      }
    }
  }

  return tokens;
}
