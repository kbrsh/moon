// Ours
const cleanCommitTitle = require('./clean-title')
const getCredits = require('./credits')

module.exports = async (hash, all, changeTypes) => {
  const related = all.filter(item => {
    return item.hash === hash
  })[0]

  const title = cleanCommitTitle(related.title, changeTypes)
  let credits = []

  if (title.ref) {
    hash = title.ref

    const rawHash = hash.split('#')[1]

    // Retrieve users that have collaborated on a change
    const collaborators = await getCredits(rawHash)

    if (collaborators) {
      credits = credits.concat(collaborators)
    }
  }

  return {
    text: `- ${title.content}: ${hash}\n`,
    credits
  }
}
