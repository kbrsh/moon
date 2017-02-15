// Packages
const capitalize = require('capitalize')
const stripWhitespace = require('trim')

// Ours
const definitions = require('./definitions')

module.exports = (title, changeTypes) => {
  const toReplace = {
    type: definitions.type(title, changeTypes),
    ref: definitions.reference(title)
  }

  for (const definition in toReplace) {
    if (!{}.hasOwnProperty.call(toReplace, definition)) {
      continue
    }

    const state = toReplace[definition]

    if (state) {
      title = title.replace('(' + state + ')', '')
    }
  }

  return {
    content: stripWhitespace(capitalize(title)),
    ref: toReplace.ref
  }
}
