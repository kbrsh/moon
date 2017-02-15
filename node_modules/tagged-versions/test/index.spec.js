'use strict';

const test = require('ava');
const sinon = require('sinon');
const childProcess = require('child-process-promise');
const taggedVersions = require('../src');

const gitLog = `
(HEAD -> master, tag: v1.2.0, origin/master, origin/HEAD);f6bf448b02c489c8676f2eeaaac72ef93980baf2;2016-10-08 11:47:01 +0100
(tag: v1.1.1);cd88316d6976ce8878a90a1a6d4eb326d16a4d68;2016-10-01 17:34:24 +0100
(tag: v1.1.0, tag: stable);61fca7630fbe863f8d890d7a33e9b45f786d79e8;2016-09-27 22:35:42 +0100
(tag: v1.0.0);9c5d6e1930831431c005bc74543f61a5cb36d617;2016-09-26 23:56:00 +0100
(tag: init);9c5d6e1930831431c005bc74543f61a5cb36d618;2016-09-26 23:56:00 +0100
`;

const versions = {
  '1.2.0': {
    version: '1.2.0',
    tag: 'v1.2.0',
    hash: 'f6bf448b02c489c8676f2eeaaac72ef93980baf2',
    date: new Date('2016-10-08T11:47:01+01:00'),
  },
  '1.1.1': {
    version: '1.1.1',
    tag: 'v1.1.1',
    hash: 'cd88316d6976ce8878a90a1a6d4eb326d16a4d68',
    date: new Date('2016-10-01T17:34:24+01:00'),
  },
  '1.1.0': {
    version: '1.1.0',
    tag: 'v1.1.0',
    hash: '61fca7630fbe863f8d890d7a33e9b45f786d79e8',
    date: new Date('2016-09-27T22:35:42+01:00'),
  },
  '1.0.0': {
    version: '1.0.0',
    tag: 'v1.0.0',
    hash: '9c5d6e1930831431c005bc74543f61a5cb36d617',
    date: new Date('2016-09-26T23:56:00+01:00'),
  },
};

test.beforeEach(t => {
  t.context.exec = childProcess.exec;
  childProcess.exec = sinon.stub().returns(Promise.resolve({ stdout: gitLog }));
});

test.afterEach(t => {
  childProcess.exec = t.context.exec;
});

test.serial('return all tagged versions', (t) => {
  return taggedVersions.getList()
    .then((list) => {
      t.deepEqual(list, [versions['1.2.0'], versions['1.1.1'], versions['1.1.0'], versions['1.0.0']]);
      t.true(childProcess.exec.calledOnce);
      t.deepEqual(childProcess.exec.lastCall.args, [
        'git log --no-walk --tags --pretty="%d;%H;%ci" --decorate=short',
      ]);
    });
});

test.serial('return all tagged versions within a range', (t) => {
  return taggedVersions.getList('^1.1.0')
    .then((list) => {
      t.deepEqual(list, [versions['1.2.0'], versions['1.1.1'], versions['1.1.0']]);
      t.true(childProcess.exec.calledOnce);
      t.deepEqual(childProcess.exec.lastCall.args, [
        'git log --no-walk --tags --pretty="%d;%H;%ci" --decorate=short',
      ]);
    });
});

test.serial('return all tagged versions from the branch', (t) => {
  const stdout = ` (HEAD -> feat-simplify-by-decoration, tag: v1.2.0, origin/master, origin/HEAD, master);f6bf448b02c489c8676f2eeaaac72ef93980baf2;2016-10-08 11:47:01 +0100
 (tag: v1.1.1);cd88316d6976ce8878a90a1a6d4eb326d16a4d68;2016-10-01 17:34:24 +0100
 (tag: v1.1.0);61fca7630fbe863f8d890d7a33e9b45f786d79e8;2016-09-27 22:35:42 +0100
 (tag: v1.0.0);9c5d6e1930831431c005bc74543f61a5cb36d617;2016-09-26 23:56:00 +0100
;af5c58c9cde876f66719e2c10a80a51cde52865b;2016-09-26 12:17:44 +0100`;

  childProcess.exec.returns(Promise.resolve({ stdout }));

  return taggedVersions.getList({ rev: 'HEAD' })
    .then((list) => {
      t.deepEqual(list, [versions['1.2.0'], versions['1.1.1'], versions['1.1.0'], versions['1.0.0']]);
      t.true(childProcess.exec.calledOnce);
      t.deepEqual(childProcess.exec.lastCall.args, [
        'git log --simplify-by-decoration --pretty="%d;%H;%ci" --decorate=short HEAD',
      ]);
    });
});

test.serial('return last tagged version', (t) => {
  return taggedVersions.getLastVersion()
    .then((version) => {
      t.deepEqual(version, versions['1.2.0']);
    });
});

test.serial('return last tagged version within a range', (t) => {
  return taggedVersions.getLastVersion('~1.1')
    .then((version) => {
      t.deepEqual(version, versions['1.1.1']);
    });
});
