"use strict";

var gitSpawnedStream = require('./');
var path = require('path');
var repoPath = process.env.REPO || (__dirname + '.git');
repoPath = path.resolve(repoPath);
var byteLimit = 5 * 1024 * 1024; // 5 Mb

// sort of a git log -n 2
var stream = gitSpawnedStream(repoPath, [
  'rev-list',
  '--max-count=2',
  '--header',
  'HEAD'
], byteLimit);

stream.on('data', function(data) {
  console.log('DATA', data.toString('utf8'));
}).on('error', function(err) {
  console.error('An error occured:');
  console.error('-----------------\n');
  console.error(err.message);
  process.exit(1);
}).on('end', function() {
  console.log("\n±±±±±±±±±±±±±±±±±\nThat's all folks!");
});
