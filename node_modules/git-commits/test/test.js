/* eslint-disable func-names */
'use strict';

require('should');
var proxyquire = require('proxyquire');
var fs = require('fs');

var streamingParser = require('../lib/parser');

describe('', function() {
  it('should parse the output', function(done) {
    var commits = [];
    var inputStream = fs.createReadStream(__dirname + '/fixture.txt', 'utf8');

    streamingParser(inputStream).on('data', function(commit) {
      commits.push(commit);
    }).on('end', function() {
      commits.should.eql(require('./output.json'));
    });

    done();
  });

  it('should create the command correctly', function() {
    var repoPath = '/home/node.git';
    var opts = {
      rev: 'master',
      limit: 2
    };

    var gitCommits = proxyquire('../', {
      './lib/parser': function(inputStream) {
        inputStream.should.eql('git-spawned-stream');
      },
      'git-spawned-stream': function(path, argz) {
        path.should.eql(repoPath);

        var args = ['rev-list', '--header', '--regexp-ignore-case'];
        args.push('--max-count=' + opts.limit);
        args.push(opts.rev);
        args.push('--');

        args.should.eql(argz);

        return 'git-spawned-stream';
      }
    });

    gitCommits(repoPath, opts);
  });
});
