'use strict'

var os = require('os')
var fs = require('fs')
var path = require('path')
var exec = require('child_process').exec
var execSync = require('child_process').execSync
var afterAll = require('after-all-results')

// Prevent from failing on windows
var nullPath = /^win/.test(process.platform) ? 'nul' : '/dev/null'

exports.isGit = function (dir, cb) {
  fs.exists(path.join(dir, '.git'), cb)
}

exports.isGitSync = function (dir) {
  return fs.existsSync(path.join(dir, '.git'))
}

exports.checkSync = function (repo) {
  var branch = exports.branchSync(repo)
  var ahead = exports.aheadSync(repo)
  var status = statusSync(repo)
  var stashes = exports.stashesSync(repo)

  return {
    branch: branch,
    ahead: ahead,
    dirty: status.dirty,
    untracked: status.untracked,
    stashes: stashes
  }
}

exports.check = function (repo, cb) {
  var next = afterAll(function (err, results) {
    if (err) return cb(err)

    var branch = results[0]
    var ahead = results[1]
    var stashes = results[2]
    var status = results[3]

    cb(null, {
      branch: branch,
      ahead: ahead,
      dirty: status.dirty,
      untracked: status.untracked,
      stashes: stashes
    })
  })

  exports.branch(repo, next())
  exports.ahead(repo, next())
  exports.stashes(repo, next())
  status(repo, next())
}

exports.untracked = function (repo, cb) {
  status(repo, function (err, result) {
    if (err) return cb(err)
    cb(null, result.untracked)
  })
}

exports.dirty = function (repo, cb) {
  status(repo, function (err, result) {
    if (err) return cb(err)
    cb(null, result.dirty)
  })
}

exports.branch = function (repo, cb) {
  exec('git show-ref >' + nullPath + ' 2>&1 && git rev-parse --abbrev-ref HEAD', { cwd: repo }, function (err, stdout, stderr) {
    if (err) return cb() // most likely the git repo doesn't have any commits yet
    cb(null, stdout.trim())
  })
}

exports.ahead = function (repo, cb) {
  exec('git show-ref >' + nullPath + ' 2>&1 && git rev-list HEAD --not --remotes', { cwd: repo }, function (err, stdout, stderr) {
    if (err) return cb(null, NaN) // depending on the state of the git repo, the command might return non-0 exit code
    stdout = stdout.trim()
    cb(null, !stdout ? 0 : parseInt(stdout.split(os.EOL).length, 10))
  })
}

var status = function (repo, cb) {
  exec('git status -s', { cwd: repo }, function (err, stdout, stderr) {
    if (err) return cb(err)
    var status = { dirty: 0, untracked: 0 }
    stdout.trim().split(os.EOL).filter(truthy).forEach(function (file) {
      if (file.substr(0, 2) === '??') status.untracked++
      else status.dirty++
    })
    cb(null, status)
  })
}

var truthy = function (obj) {
  return !!obj
}

exports.commit = function (repo, cb) {
  exec('git rev-parse --short HEAD', { cwd: repo }, function (err, stdout, stderr) {
    if (err) return cb(err)
    var commitHash = stdout.trim()
    cb(null, commitHash)
  })
}

exports.stashes = function (repo, cb) {
  exec('git stash list', { cwd: repo }, function (err, stdout, stderr) {
    if (err) return cb(err)
    var stashes = stdout.trim().split(os.EOL).filter(truthy)
    cb(null, stashes.length)
  })
}

//* SYNC methods *//
exports.untrackedSync = function (repo) {
  return statusSync(repo).untracked
}

exports.dirtySync = function (repo) {
  return statusSync(repo).dirty
}

exports.branchSync = function (repo) {
  try {
    var stdout = execSync('git show-ref >' + nullPath + ' 2>&1 && git rev-parse --abbrev-ref HEAD', { cwd: repo }).toString()
    return stdout.trim()
  } catch (err) {
    return null // most likely the git repo doesn't have any commits yet
  }
}

exports.aheadSync = function (repo) {
  try {
    var stdout = execSync('git show-ref >' + nullPath + ' 2>&1 && git rev-list HEAD --not --remotes', { cwd: repo }).toString()
    stdout = stdout.trim()
    return !stdout ? 0 : parseInt(stdout.split(os.EOL).length, 10)
  } catch (err) {
    return NaN
  }
}

// Throws error
var statusSync = function (repo) {
  var stdout = execSync('git status -s', { cwd: repo }).toString()
  var status = { dirty: 0, untracked: 0 }
  stdout.trim().split(os.EOL).filter(truthy).forEach(function (file) {
    if (file.substr(0, 2) === '??') status.untracked++
    else status.dirty++
  })
  return status
}

// Throws error
exports.commitSync = function (repo) {
  var stdout = execSync('git rev-parse --short HEAD', { cwd: repo }).toString()
  var commitHash = stdout.trim()
  return commitHash
}

// Throws error
exports.stashesSync = function (repo) {
  var stdout = execSync('git stash list', { cwd: repo }).toString()
  var stashes = stdout.trim().split(os.EOL).filter(truthy)
  return stashes.length
}
