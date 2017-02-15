'use strict'

var test = require('tape')
var semver = require('semver')
var git = require('./')

var ZEROTEN = semver.lt(process.version, '0.12.0')

test('#isGit()', function (t) {
  var dir = process.cwd()
  git.isGit(dir, function (exists) {
    t.equal(exists, true)
    t.end()
  })
})

test('#isGitSync()', function (t) {
  var dir = process.cwd()
  var result = git.isGitSync(dir)
  t.equal(result, true)
  t.end()
})

test('#check()', function (t) {
  var dir = process.cwd()
  git.check(dir, function (err, result) {
    t.error(err)
    t.deepEqual(Object.keys(result), ['branch', 'ahead', 'dirty', 'untracked', 'stashes'])
    t.equal(typeof result.branch, 'string')
    t.equal(typeof result.ahead, 'number')
    t.equal(typeof result.dirty, 'number')
    t.equal(typeof result.untracked, 'number')
    t.equal(typeof result.stashes, 'number')
    t.end()
  })
})

test('#checkSync()', function (t) {
  if (ZEROTEN) return t.end()
  var dir = process.cwd()
  try {
    var result = git.checkSync(dir)
    t.deepEqual(Object.keys(result), ['branch', 'ahead', 'dirty', 'untracked', 'stashes'])
    t.equal(typeof result.branch, 'string')
    t.equal(typeof result.ahead, 'number')
    t.equal(typeof result.dirty, 'number')
    t.equal(typeof result.untracked, 'number')
    t.equal(typeof result.stashes, 'number')
  } catch (err) {
    t.error(err)
  }
  t.end()
})

test('#untracked()', function (t) {
  var dir = process.cwd()
  git.untracked(dir, function (err, result) {
    t.error(err)
    t.equal(typeof result, 'number')
    t.end()
  })
})

test('#untrackedSync()', function (t) {
  if (ZEROTEN) return t.end()
  var dir = process.cwd()
  try {
    var result = git.untrackedSync(dir)
    t.equal(typeof result, 'number')
  } catch (err) {
    t.error(err)
  }
  t.end()
})

test('#dirty()', function (t) {
  var dir = process.cwd()
  git.dirty(dir, function (err, result) {
    t.error(err)
    t.equal(typeof result, 'number')
    t.end()
  })
})

test('#dirtySync()', function (t) {
  if (ZEROTEN) return t.end()
  var dir = process.cwd()
  try {
    var result = git.dirtySync(dir)
    t.equal(typeof result, 'number')
  } catch (err) {
    t.error(err)
  }
  t.end()
})

test('#branch()', function (t) {
  var dir = process.cwd()
  git.branch(dir, function (err, result) {
    t.error(err)
    t.equal(typeof result, 'string')
    t.end()
  })
})

test('#branchSync()', function (t) {
  if (ZEROTEN) return t.end()
  var dir = process.cwd()
  try {
    var result = git.branchSync(dir)
    t.equal(typeof result, 'string')
  } catch (err) {
    t.error(err)
  }
  t.end()
})

test('#ahead()', function (t) {
  var dir = process.cwd()
  git.ahead(dir, function (err, result) {
    t.error(err)
    t.equal(typeof result, 'number')
    t.end()
  })
})

test('#aheadSync()', function (t) {
  if (ZEROTEN) return t.end()
  var dir = process.cwd()
  try {
    var result = git.aheadSync(dir)
    t.equal(typeof result, 'number')
  } catch (err) {
    t.error(err)
  }
  t.end()
})

test('#commit()', function (t) {
  var dir = process.cwd()
  git.commit(dir, function (err, result) {
    t.error(err)
    t.equal(typeof result, 'string')
    t.end()
  })
})

test('#commitSync()', function (t) {
  if (ZEROTEN) return t.end()
  var dir = process.cwd()
  try {
    var result = git.commitSync(dir)
    t.equal(typeof result, 'string')
  } catch (err) {
    t.error(err)
  }
  t.end()
})

test('#stashes()', function (t) {
  var dir = process.cwd()
  git.stashes(dir, function (err, result) {
    t.error(err)
    t.equal(typeof result, 'number')
    t.end()
  })
})

test('#stashesSync()', function (t) {
  if (ZEROTEN) return t.end()
  var dir = process.cwd()
  try {
    var result = git.stashesSync(dir)
    t.equal(typeof result, 'number')
  } catch (err) {
    t.error(err)
  }
  t.end()
})
