exports.type = (text, changeTypes) => {
  for (const type of changeTypes) {
    const handle = '(' + type.handle + ')'

    if (text.includes(handle)) {
      return type.handle
    }
  }

  return false
}

exports.reference = title => {
  const match = / \(#[-0-9]+\)/.exec(title)

  if (!match) {
    return false
  }

  return match[0].replace(' (', '').replace(')', '')
}
