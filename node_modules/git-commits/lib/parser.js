'use strict';

var parseCommit = require('git-parse-commit');
var splitStream = require('split-transform-stream');

function streamCommits(inputStream) {
  var commit = '';

  function write(line, enc, cb) {
    var matched = line.match(/^(\u0000){0,1}([0-9a-fA-F]{40})/);

    if (matched) {
      if (commit) {
        this.push(parseCommit(commit), 'utf8');
      }

      commit = line;
    } else {
      if (commit) {
        commit += ('\n' + line);
      }
    }

    cb();
  }

  function end(cb) {
    if (commit) {
      this.push(parseCommit(commit), 'utf8');
    }

    cb();
  }

  return splitStream(inputStream, write, end);
}

module.exports = streamCommits;
