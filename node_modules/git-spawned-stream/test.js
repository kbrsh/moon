"use strict";

var proxyquire = require('proxyquire');
var should = require('should');

describe('git-spawned-stream', function() {
  it('should delegate with the correct params', function(done) {
    var spawnArgs = ['rev-list', '--max-count=2', 'HEAD'];
    var limit = 1024 * 1024;

    var gitSpawnedStream = proxyquire.load('./index', {
      'spawn-to-readstream': function(spawnStream, bytes) {
        spawnStream.should.eql('spawnStream');
        bytes.should.eql(limit);

        done();
      },
      'child_process': {
        spawn: function(cmd, args) {
          spawnArgs.unshift('--git-dir=/home/node.git');
          cmd.should.eql('git');
          args.should.eql(spawnArgs);

          return 'spawnStream';
        }
      }
    });

    gitSpawnedStream('/home/node.git', spawnArgs, limit);
  });
});
