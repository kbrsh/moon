'use strict';

var parseHuman = require('git-parse-human2');

function parseAuthors(line, info) {
  if (line.indexOf('author') !== -1) {
    info.author = parseHuman(line.replace('author ', ''));

    if (info.author) {
      return true;
    }
  }
  if (line.indexOf('committer') !== -1) {
    info.committer = parseHuman(line.replace('committer ', ''));

    if (info.committer) {
      return true;
    }
  }

  return false;
}

module.exports = parseAuthors;
