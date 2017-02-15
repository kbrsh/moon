"use strict";

var run = require('spawn-to-readstream');
var spawn = require('child_process').spawn;
var debug = require('debug')('git-spawned-stream');

module.exports = function(repoPath, args, limit) {
  var _args = ['--git-dir=' + repoPath];

  args.forEach(function(item) {
    _args.push(item);
  });

  debug('args', _args);
  debug('limit', limit);

  return run(spawn('git', _args), limit);
};
