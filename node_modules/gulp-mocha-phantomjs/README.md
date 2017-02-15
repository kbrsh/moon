# [gulp](https://github.com/wearefractal/gulp)-mocha-phantomjs [![Build Status](https://travis-ci.org/mrhooray/gulp-mocha-phantomjs.svg?branch=master)](https://travis-ci.org/mrhooray/gulp-mocha-phantomjs) [![Build status](https://ci.appveyor.com/api/projects/status/4ngkp3ijx27alr5u?svg=true)](https://ci.appveyor.com/project/mrhooray/gulp-mocha-phantomjs)
> run client-side [Mocha](https://github.com/visionmedia/mocha) tests with [PhantomJS](https://github.com/ariya/phantomjs)

> a simple wrapper for [mocha-phantomjs-core](https://github.com/nathanboktae/mocha-phantomjs-core) library

## Installation
### node
```shell
$ npm install gulp-mocha-phantomjs --save-dev
```

## Usage
```html
<!DOCTYPE html>
<html>
    <head>
        <title>Mocha</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="../node_modules/mocha/mocha.css" />
    </head>
    <body>
        <script src="../node_modules/should/should.js"></script>
        <script src="../node_modules/mocha/mocha.js"></script>
        <script>mocha.setup('bdd')</script>
        <script>
            describe('true', function () {
                it('should be true', function () {
                    true.should.equal(true);
                });
            });
        </script>
        <script>
            mocha.run();
        </script>
    </body>
</html>
```

```javascript
var gulp = require('gulp');
var mochaPhantomJS = require('gulp-mocha-phantomjs');

gulp.task('test', function () {
    return gulp
    .src('test/runner.html')
    .pipe(mochaPhantomJS());
});
```

Reporter can be chosen via `reporter` option:

```javascript
gulp.task('test', function () {
    return gulp
    .src('test/runner.html')
    .pipe(mochaPhantomJS({reporter: 'spec'}));
});
```

Output of mocha tests can be piped into a file via `dump` option:

```javascript
gulp.task('test', function () {
    return gulp
    .src('test/runner.html')
    .pipe(mochaPhantomJS({reporter: 'spec', dump:'test.log'}));
});
```

Test against remote by url:

```javascript
gulp.task('test', function () {
    var stream = mochaPhantomJS();
    stream.write({path: 'http://localhost:8000/index.html'});
    stream.end();
    return stream;
});
```

Suppress PhantomJS’s console output:

```javascript
gulp.task('test', function() {
    return gulp
    .src('test/runner.html')
    .pipe(mochaPhantomJS({
        suppressStdout: true,
        suppressStderr: true
    }));
});
```

Pass options to mocha and/or PhantomJS:

```javascript
gulp.task('test', function () {
    return gulp
    .src('test/runner.html')
    .pipe(mochaPhantomJS({
        reporter: 'tap',
        mocha: {
            grep: 'pattern'
        },
        phantomjs: {
            viewportSize: {
                width: 1024,
                height: 768
            },
            useColors:true
        }
    }));
});
```

## License
MIT
