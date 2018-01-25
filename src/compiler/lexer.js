/**
 * Check if the template is at the start of a comment.
 *
 * @param {String} template HTML string we are analysing.
 *
 * @return {Boolean} True if it is the start of a comment, false otherwise.
 */
const isComment = function(template) {
  return template.substr(0, 4) === "<!--";
}

/**
 * Gets the comment from the start of the template.
 *
 * @param {String} template HTML string to get the comment from.
 *
 * @return {String} Whole string of the comment. Including `<!--` and `-->`.
 */
const getComment = function(template) {
  const commentEnd = template.indexOf("-->", 4);

  // Endless comment
  if(commentEnd === -1) {
    return template;
  }

  return template.substring(0, commentEnd + 3);
}

/**
 * Get attributes from HTML.
 *
 * @param {String} template HTML string to get attributes from.
 *
 * @return {Object} An object containing two properties. `attributes`, a list
 * of the found attributes. And `match`, an string with all the text from the
 * start of the attributes until before the `>`.
 */
const getAttributes = function(template) {

  const attributes = [];
  let match = "";

  while(true) {

    let attrName = template.match(attrNameRE);

    // No more attributes
    if(attrName === null) {
      break;
    }

    template = template.substr(attrName[0].length);
    match += attrName[0];

    let attrValue = "";

    // Attr value
    if(attrName[2] === "=") {
      attrValue = template.match(attrValueRE);

      template = template.substr(attrValue[0].length);
      match += attrValue[0];

      attrValue = attrValue[2];
    }

    attrName = attrName[1].split(":");
    attributes.push({
      name: attrName[0],
      value: attrValue,
      argument: attrName[1],
      data: {}
    });
  }

  return {
    match: match,
    attributes: attributes
  };
}

/**
 * Gets text.
 *
 * @param {String} template HTML string to get text from.
 *
 * @return {String} Text, not tags or HTML elements, until next tag.
 */
const getText = function(template) {

  const endText = template.search(tagOrCommentStartRE);

  let text = "";
  if(endText === -1) {
    return template;
  }

  return template.substring(0, endText);
}

const lex = function(template) {

  const tokens = [];
  let current = 0;

  while(template.length > 0) {

    // Text
    if(template[current] !== "<") {

      const text = getText(template);

      template = template.substr(text.length);

      // Escape text
      if(text.replace(/\s/g, "").length > 0) {
        tokens.push({
          type: "Text",
          value: text.replace(escapeRE, function(match) {
            return escapeMap[match];
          })
        });
      }

      continue;
    }

    // Comment
    if(isComment(template)) {
      const comment = getComment(template);
      template = template.substr(comment.length);
      continue;
    }

    // Tag
    let tagType = '';
    let attributes = [];

    let closeStart = false;
    let closeEnd = false;

    // Tag start
    const tagStart = template.match(tagStartRE);
    closeStart = tagStart[1] === "/";

    template = template.substr(tagStart[0].length);

    // Tag name
    const tagName = template.match(tagNameRE);
    tagType = tagName[1];

    template = template.substr(tagName[0].length);

    // Attributes
    const attrObj = getAttributes(template);
    attributes = attrObj.attributes;

    template = template.substr(attrObj.match.length);

    // Tag end
    const tagEnd = template.match(tagEndRE);
    closeEnd = tagEnd[1] === "/";

    template = template.substr(tagEnd[0].length);

    // Push token
    tokens.push({
      type: "Tag",
      value: tagType,
      attributes: attributes,
      closeStart: closeStart,
      closeEnd: closeEnd
    });
  }

  return tokens;
}
