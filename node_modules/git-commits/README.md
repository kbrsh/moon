# git-commits

Get the commit history of a repo in a Node streamy way by shelling out to [git-rev-list(1)](https://www.kernel.org/pub/software/scm/git/docs/git-rev-list.html).

[![build status](https://secure.travis-ci.org/alessioalex/git-commits.png)](http://travis-ci.org/alessioalex/git-commits)

## Usage

```js
gitCommits(repoPath, options)
```

Where `options` can contain a lot of properties (read ./index.js) for limiting the number of commits, or filtering the commits based on a search term etc.

Example:

```js
var gitCommits = require('git-commits');
var path = require('path');
var repoPath = path.resolve(process.env.REPO || (__dirname + '/.git'));

gitCommits(repoPath, {
  limit: 2
}).on('data', function(commit) {
  console.log(commit);
  console.log('\n------------------\n');
}).on('error', function(err) {
  throw err;
}).on('end', function() {
  console.log("That's all, folks!");
});
```

Sample output:

```bash
→ node example.js
{ parents: [ '3460bc096c20e04e022915f77a6195059b76a893' ],
  hash: '86e567818bf22952f325a151eb0124d1b45c55f8',
  tree: '36672c28ca465e9fa80e71f7015fd71bd9470837',
  author:
   { name: 'Alexandru Vladutu',
     email: 'alexandru.vladutu@gmail.com',
     timestamp: 1407092756,
     timezone: '+0300' },
  committer:
   { name: 'Alexandru Vladutu',
     email: 'alexandru.vladutu@gmail.com',
     timestamp: 1407092756,
     timezone: '+0300' },
  title: 'bump to v0.1.2',
  description: '' }

------------------

{ parents: [ '392fc8d013ed95e85fcab9988f45601bf93c0ed0' ],
  hash: '3460bc096c20e04e022915f77a6195059b76a893',
  tree: '23ab88115c31a236bcf75d462319c7ce933fc33a',
  author:
   { name: 'Alexandru Vladutu',
     email: 'alexandru.vladutu@gmail.com',
     timestamp: 1407092681,
     timezone: '+0300' },
  committer:
   { name: 'Alexandru Vladutu',
     email: 'alexandru.vladutu@gmail.com',
     timestamp: 1407092681,
     timezone: '+0300' },
  title: 'Updated parser',
  description: '' }

------------------

That's all, folks!
```

## Tests

```
npm test
```

## License

MIT
