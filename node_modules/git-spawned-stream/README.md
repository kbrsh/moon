# git-spawned-stream

Create a readable stream from a spawned git process.

## Usage

```js
gitSpawnedStream(repoPath, spawnArguments, limitInBytes)
```

Arguments:

- `repoPath` - the path to the repo, ex: /home/alex/node/.git (or the path to the git bare repo)
- `spawnArguments` - the arguments that will be passed to the `child_process.spawn` function
- `limitInBytes` - kill the process if it exceeds the imposed limit (sends more data than allowed)

Example:

```js
var gitSpawnedStream = require('git-spawned-stream');
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
}).on('end', function(killed) {
  // when the stream is cut, killed === true
  console.log("\n±±±±±±±±±±±±±±±±±\nThat's all folks!");
});
```

## License

MIT
