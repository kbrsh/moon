# tagged-versions

> Get tagged semver-compatible project versions [{ version, tag, hash, date }]

[![Build Status][travis-badge]][travis-link]
[![Coverage Status][coveralls-badge]][coveralls-link]
[![NPM version][shields-badge]][npm-link]

## Installation
```sh
npm install tagged-versions --save
```

Supported Node versions: 5+

## Usage

### All project versions
Return all the tagged project versions:
```javascript
const taggedVersions = require('tagged-versions');
return taggedVersions.getList()
  .then(versions => console.log(versions));

// [
//   { version: '1.2.0', tag: 'v1.2.0', hash: 'f6bf448b02c489c8676f2eeaaac72ef93980baf2', date: <Date> },
//   { version: '1.1.1', tag: 'v1.1.1', hash: 'b656238b0fc2502b19bd0e803eb87447840dc52a', date: <Date> },
//   { version: '1.1.0', tag: 'v1.1.0', hash: '1d56b88b0fc2585ffaf43e416b87440667c3c53f', date: <Date> },
//   { version: '1.0.0', tag: 'v1.0.0', hash: '06743d3f902b19bd0e802e40462d87ba2b05740d', date: <Date> },
// ]
```

You can optionally filter versions with a [semver range](https://github.com/npm/node-semver#advanced-range-syntax):
```javascript
const taggedVersions = require('tagged-versions');
return taggedVersions.getList('^1.1.0')
  .then(versions => console.log(versions));

// [
//   { version: '1.2.0', tag: 'v1.2.0', hash: 'f6bf448b02c489c8676f2eeaaac72ef93980baf2', date: <Date> },
//   { version: '1.1.1', tag: 'v1.1.1', hash: 'b656238b0fc2502b19bd0e803eb87447840dc52a', date: <Date> },
//   { version: '1.1.0', tag: 'v1.1.0', hash: '1d56b88b0fc2585ffaf43e416b87440667c3c53f', date: <Date> },
// ]
```

Or with a [revision range](https://git-scm.com/docs/revisions#_specifying_ranges):
```javascript
const taggedVersions = require('tagged-versions');
return taggedVersions.getList({rev: 'v1.1.0..v1.2.0'})
  .then(versions => console.log(versions));

// [
//   { version: '1.2.0', tag: 'v1.2.0', hash: 'f6bf448b02c489c8676f2eeaaac72ef93980baf2', date: <Date> },
//   { version: '1.1.1', tag: 'v1.1.1', hash: 'b656238b0fc2502b19bd0e803eb87447840dc52a', date: <Date> }
// ]
```

### Last project version
Return the last tagged project version:
```javascript
const taggedVersions = require('tagged-versions');
return taggedVersions.getLastVersion()
  .then(versions => console.log(version));

// {
//   version: '1.2.0',
//   tag: 'v1.2.0',
//   hash: 'f6bf448b02c489c8676f2eeaaac72ef93980baf2',
//   date: new Date('2016-10-08T10:47:01.000Z')
// }
```

Like with `getList`, you can also filter with a [semver range](https://github.com/npm/node-semver#advanced-range-syntax):
```javascript
const taggedVersions = require('tagged-versions');
return taggedVersions.getLastVersion('~1.1')
  .then(versions => console.log(version));

// {
//   version: '1.1.1',
//   tag: 'v1.1.1',
//   hash: 'b656238b0fc2502b19bd0e803eb87447840dc52a',
//   date: new Date('2016-10-01T16:34:24.000Z')
// }
```

## Contributing
Please follow the [Airbnb guidelines](https://github.com/airbnb/javascript) and commit your changes with [commitzen](https://www.npmjs.com/package/commitizen) using `git cz`.

[travis-badge]: https://travis-ci.org/ikhemissi/tagged-versions.svg?branch=master
[travis-link]: https://travis-ci.org/ikhemissi/tagged-versions
[coveralls-badge]: https://coveralls.io/repos/github/ikhemissi/tagged-versions/badge.svg?branch=master
[coveralls-link]: https://coveralls.io/github/ikhemissi/tagged-versions?branch=master
[shields-badge]: https://img.shields.io/npm/v/tagged-versions.svg
[npm-link]: https://www.npmjs.com/package/tagged-versions
