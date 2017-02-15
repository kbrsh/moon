'use strict';

var streamCommits = require('./lib/parser');
var gitSpawnedStream = require('git-spawned-stream');

function streamHistory(repoPath, ops) {
  var opts = ops || {};
  var searchIn = '';
  var searchType = '';
  var rev = opts.rev || 'HEAD';
  var limit = (opts.limit) ? ('--max-count=' + opts.limit) : '';
  var skip = (opts.skip) ? ('--skip=' + opts.skip) : '';
  var path = opts.path || opts.file || '';
  var since;
  var until;

  if (opts.since || opts.after) {
    since = '--since=' + (opts.since || opts.after);
  }

  if (opts.until || opts.before) {
    until = '--until=' + (opts.until || opts.before);
  }

  if (opts.searchTerm) {
    searchType  = !opts.regex ? '--fixed-strings' : '--extended-regexp';
    var term = opts.searchTerm.replace(/'/g, '').replace(/"/g, '');

    if (!opts.searchIn || opts.searchIn === 'messages') {
      searchIn = '--grep';
    } else {
      if (opts.searchIn === 'authors') {
        searchIn = '--author';
      } else if (opts.searchIn === 'committers') {
        searchIn = '--committer';
      } else {
        searchIn = '--grep';
      }
    }

    searchIn += '=' + term;
  }

  var args = ['rev-list', '--header', '--regexp-ignore-case'];

  [
    searchIn, searchType, since, until, limit, skip, rev, '--', path
  ].forEach(function addOptions(el) {
    if (el) {
      args.push(el);
    }
  });

  return streamCommits(gitSpawnedStream(repoPath, args));
}

module.exports = streamHistory;
