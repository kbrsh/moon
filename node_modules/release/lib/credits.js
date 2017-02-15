// Ours
const connect = require('./connect')
const repo = require('./repo')

const getPullRequest = number => new Promise(async (resolve, reject) => {
  const repoDetails = await repo.getRepo()
  const github = await connect()

  github.pullRequests.get({
    owner: repoDetails.user,
    repo: repoDetails.repo,
    number
  }, (err, results) => {
    if (err) {
      reject(err)
      return
    }

    resolve(results)
  })
})

module.exports = async number => {
  let data

  try {
    data = await getPullRequest(number)
  } catch (err) {
    return
  }

  if (data.user) {
    return [data.user.login]
  }

  return false
}
