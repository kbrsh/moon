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
 * Gets the whole of the tag start. From `<` to the start of tag name,
 * including the `\` if existent.
 *
 * @param {String} template HTML string to get the tag start from.
 *
 * @return {RegExp} RegExp match object. Group 1 is the `/`, if existent,
 * empty string otherwise.
 */
const getTagStart = function(template) {
  // Group 1: `/` or `""` (empty string)
  const tagStartRegExp = /^<\s*(\/?)\s*/i;
  return template.match(tagStartRegExp);
}

/**
 * Get the tag end from string.
 *
 * @param {String} template HTML string to get the end of the tag from.
 *
 * @return {RegExp} RegExp match object. Group 1 is the closing slash, if
 * existent.
 */
const getTagEnd = function(template) {
  const tagEndRegExp = /^(\/?)\s*>/i;
  return template.match(tagEndRegExp);
}

/**
 * Get HTML tag element's name.
 *
 * @param {String} template HTML to get tag name from.
 *
 * @return {RegExp} RegExp match object. Group 1 is the name of the tag.
 */
const getTagName = function(template) {
  // Group 1: tag name
  const tagNameRegExp = /^([_A-Z][_A-Z\d\-\.]*)\s*/i;
  return template.match(tagNameRegExp);
}

/**
 * Get attribute name from string.
 *
 * @param {String} template HTML string to get attribute name from.
 *
 * @return {RegExp} RegExp match object. Group 1 is the name of the attribute.
 * Group 2 is what is after the name, `=` or `\>` and `>`.
 */
const getAttrName = function(template) {
  // Group 1: name of attribute
  // Group 2: after attrbute name `=`
  const attrNameRegExp = /^([_A-Z][_A-Z\d\-\.:]*)\s*(=?)\s*/i;
  return template.match(attrNameRegExp);
}

/**
 * Gets the attribute value from the string.
 *
 * @param {String} template HTML string to get attribute value from.
 *
 * @return {RegExp} RegExp match object. Group 1 is the quote type used for the
 * value. Group 2 is the value itself. Everything between group 1 quotes.
 */
const getAttrValue = function(template) {
  // Group 1: quote type `'` or `"`
  // Group 2: value between quotes
  const attrValueRegExp = /^(["']?)(.*?)\1\s*/i;
  return template.match(attrValueRegExp);
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

    let attrName = getAttrName(template);

    // No more attributes
    if(attrName === null) {
      break;
    }

    template = template.substr(attrName[0].length);
    match += attrName[0];

    let attrValue = "";

    // Attr value
    if(attrName[2] === "=") {
      attrValue = getAttrValue(template);

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
 * Gets everything that is between tags.
 *
 * @param {String} template HTML string to get text from.
 *
 * @return {String} CString contatining all the text between tags.
 */
const getText = function(template) {

  let text = "";

  const nextTag = template.indexOf("<");


}


const lex = function(template) {

  const tokens = [];
  let current = 0;

  while(template.length > 0) {

    let char = template[current];

    // Tag
    if(char === "<") {

      // Comment
      if(isComment(template)) {
        const comment = getComment(template);
        template = template.substr(comment.length);
        continue;
      }

      let tagToken = {
        type: "Tag",
      }

      // Token properties
      let tagType = '';
      let attributes = [];

      let closeStart = false;
      let closeEnd = false;

      // Tag start
      const tagStart = getTagStart(template);
      closeStart = tagStart[1] === "/";

      template = template.substr(tagStart[0].length);

      // Tag name
      const tagName = getTagName(template);
      tagType = tagName[1];

      template = template.substr(tagName[0].length);

      // Attributes
      const attrObj = getAttributes(template);
      attributes = attrObj.attributes;

      template = template.substr(attrObj.match.length);

      // Tag end
      const tagEnd = getTagEnd(template);
      closeEnd = tagEnd[1] === "/";

      template = template.substr(tagEnd[0].length);

      tagToken.value = tagType;
      tagToken.attributes = attributes;
      tagToken.closeStart = closeStart;
      tagToken.closeEnd = closeEnd;
      tokens.push(tagToken);

    } else {

      const endText = template.search(/<\/?(?:[A-Z]+\w*)|<!--/i);

      let text = "";
      if(endText === -1) {
        text = template;
        template = "";
      } else {
        text = template.substring(0, endText);
        template = template.substr(endText);
      }

      if(text.replace(/\s/g, "").length > 0) {
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