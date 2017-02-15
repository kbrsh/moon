// Packages
const git = require('git-state')
const repoName = require('git-repo-name')
const repoUser = require('git-username')

// Ours
const handleSpinner = require('./spinner')

exports.getRepo = () => new Promise(resolve => {
  repoName((err, repo) => {
    if (err) {
      handleSpinner.fail('Could not determine GitHub repository.')
      return
    }

    const details = {repo}
    details.user = repoUser()

    resolve(details)
  })
})

exports.branchSynced = async () => new Promise(resolve => {
  const path = process.cwd()

  const ignore = [
    'branch',
    'stashes',
    'untracked'
  ]

  git.isGit(path, exists => {
    if (!exists) {
      return
    }

    git.check(path, (err, results) => {
      if (err) {
        resolve(false)
        return
      }

      for (const state of ignore) {
        delete results[state]
      }

      for (const result in results) {
        if (results[result] > 0) {
          resolve(false)
          break
        }
      }

      resolve(true)
    })
  })
})
