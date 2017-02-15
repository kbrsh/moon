# git-parse-commit

Parse git commit data, like the one we get after running `git rev-list --max-count=5 --header HEAD --`.

[![build status](https://secure.travis-ci.org/alessioalex/git-parse-commit.png)](http://travis-ci.org/alessioalex/git-parse-commit)

## Usage

Say we have a commit like the following:

```
c6ee495e2ed2bffde4bee1fa658c8834dd0bcd35
tree 0159cc0b86eba46e25068e45d098a49055068ddf
parent e153fbfe636459a3246f0dfa5fff84157827ca21
parent da4d841e16cbcb3316ba56a5802a71e4fc07bb6f
author Yves Senn <yves.senn@gmail.com> 1400484883 +0200
committer Yves Senn <yves.senn@gmail.com> 1400484883 +0200

    Merge pull request #14962 from arunagw/aa-fix-rake-activerecord
    
    Reorganize ActiveRecord tasks [Arun Agrawal & Abd ar-Rahman Hamidi]
```

We parse it using the module and log the output to the console:

```js
var fs = require('fs');
var parseCommit = require('../');
console.log(parseCommit(fs.readFileSync(__dirname + '/commit.txt', 'utf8')));
```

The output will look like this:

```
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
```

## More advanced examples

Checkout the examples && tests.

## Tests

```bash
npm test
```

## License

MIT
