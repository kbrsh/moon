'use strict';

var gulp = require('gulp');
var pkg = require('./package.json');
var uglify = require("gulp-uglifyjs");
var istanbul = require("gulp-istanbul");
var babel = require('gulp-babel');
var replace = require('gulp-replace');
var istanbulReport = require('gulp-istanbul-report');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var comment = '\/*\r\n* Moon v' + pkg.version + '\r\n* Copyright 2016-2017, Kabir Shah\r\n* https:\/\/github.com\/KingPixil\/moon\/\r\n* Free to use under the MIT license.\r\n* https:\/\/kingpixil.github.io\/license\r\n*\/\r\n';
var $ = require('gulp-load-plugins')();

// Build Moon
gulp.task('transpile', function () {
  return gulp.src(['./src/index.js'])
    .pipe($.include())
    .pipe(babel({
      presets: ['transpile-moon']
    }))
    .pipe($.concat('moon.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('build', ['transpile'], function () {
  return gulp.src(['./src/wrapper.js'])
    .pipe($.include())
    .pipe($.concat('moon.js'))
    .pipe($.header(comment + '\n'))
    .pipe(replace('__VERSION__', pkg.version))
    .pipe($.size())
    .pipe(gulp.dest('./dist/'));
});

// Build minified (compressed) version of Moon
gulp.task('minify', ['build'], function() {
  return gulp.src(['./dist/moon.js'])
    .pipe(uglify())
    .pipe($.header(comment))
    .pipe($.size())
    .pipe($.concat('moon.min.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('instrument', function () {
	return gulp.src(['dist/moon.js'])
		.pipe(istanbul({
			coverageVariable: '__coverage__'
		}))
		.pipe(gulp.dest('coverage/'))
});

// Run Tests
gulp.task('test', ['instrument'], function () {
    return gulp.src('test/test.html', {read:false})
      .pipe(mochaPhantomJS({
        phantomjs: {
          hooks: 'mocha-phantomjs-istanbul',
          coverageFile: './coverage/coverage.json'
        },
        reporter: 'spec'
      }))
      .on('finish', function() {
        gulp.src('./coverage/coverage.json')
          .pipe(istanbulReport())
      });
});


// Default task
gulp.task('default', ['build', 'minify']);
