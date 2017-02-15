/* eslint-disable no-console, func-names */
'use strict';

// the commit data looks like this:
/*
c6ee495e2ed2bffde4bee1fa658c8834dd0bcd35
tree 0159cc0b86eba46e25068e45d098a49055068ddf
parent e153fbfe636459a3246f0dfa5fff84157827ca21
parent da4d841e16cbcb3316ba56a5802a71e4fc07bb6f
author Yves Senn <yves.senn@gmail.com> 1400484883 +0200
committer Yves Senn <yves.senn@gmail.com> 1400484883 +0200

    Merge pull request #14962 from arunagw/aa-fix-rake-activerecord

    Reorganize ActiveRecord tasks [Arun Agrawal & Abd ar-Rahman Hamidi]
*/

var fs = require('fs');
var parseCommit = require('../');
console.log(parseCommit(fs.readFileSync(__dirname + '/commit.txt', 'utf8')));

// The output will be the following:
/*
{ parents:
   [ 'e153fbfe636459a3246f0dfa5fff84157827ca21',
     'da4d841e16cbcb3316ba56a5802a71e4fc07bb6f' ],
  hash: 'c6ee495e2ed2bffde4bee1fa658c8834dd0bcd35',
  tree: '0159cc0b86eba46e25068e45d098a49055068ddf',
  author:
   { name: 'Yves Senn',
     email: 'yves.senn@gmail.com',
     timestamp: 1400484883,
     timezone: '+0200' },
  committer:
   { name: 'Yves Senn',
     email: 'yves.senn@gmail.com',
     timestamp: 1400484883,
     timezone: '+0200' },
  title: 'Merge pull request #14962 from arunagw/aa-fix-rake-activerecord',
  description: 'Reorganize ActiveRecord tasks [Arun Agrawal & Abd ar-Rahman Hamidi]\n' }
*/
