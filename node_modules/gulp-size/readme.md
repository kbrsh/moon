# gulp-size [![Build Status](https://travis-ci.org/sindresorhus/gulp-size.svg?branch=master)](https://travis-ci.org/sindresorhus/gulp-size)

> Display the size of your project

<img src="screenshot.png" width="341">

Logs out the total size of files in the stream and optionally the individual file-sizes.


## Install

```
$ npm install --save-dev gulp-size
```


## Usage

```js
const gulp = require('gulp');
const size = require('gulp-size');

gulp.task('default', () =>
	gulp.src('fixture.js')
		.pipe(size())
		.pipe(gulp.dest('dist'))
);
```


## API

### size([options])

#### options

##### title

Type: `string`<br>
Default: ''

Give it a title so it's possible to distinguish the output of multiple instances logging at once.

##### gzip

Type: `boolean`<br>
Default: `false`

Displays the gzipped size instead.

##### pretty

Type: `boolean`<br>
Default: true

Displays prettified size: `1337 B` → `1.34 kB`.

##### showFiles

Type: `boolean`<br>
Default: `false`

Displays the size of every file instead of just the total size.

##### showTotal

Type: `boolean`<br>
Default: `true`

Displays the total of all files.

### size.size

Type: `number`<br>
Example: `12423000`

The total size of all files in bytes.

### size.prettySize

Type: `string`<br>
Example: `'14 kB'`

Prettified version of `.size`.

Useful for eg. reporting the total project size with [`gulp-notify`](https://github.com/mikaelbr/gulp-notify):

```js
const gulp = require('gulp');
const size = require('gulp-size');
const notify = require('gulp-notify');

gulp.task('default', () => {
	const s = size();

	return gulp.src('fixture.js')
		.pipe(s)
		.pipe(gulp.dest('dist'))
		.pipe(notify({
			onLast: true,
			message: () => `Total size ${s.prettySize}`
		}));
});
```


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
