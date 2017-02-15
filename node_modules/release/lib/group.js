module.exports = (changes, changeTypes) => {
  const types = {}

  for (const type of changeTypes) {
    types[type.handle] = []
  }

  for (const change in changes) {
    if (!{}.hasOwnProperty.call(changes, change)) {
      continue
    }

    const changeType = changes[change]

    if (changeType === 'ignore') {
      continue
    }

    types[changeType].push(change)
  }

  return types
}
