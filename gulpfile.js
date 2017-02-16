'use strict';

var gulp = require('gulp');
var pkg = require('./package.json');
var uglify = require("gulp-uglifyjs");
var istanbul = require("gulp-istanbul");
var babel = require('gulp-babel');
var replace = require('gulp-replace');
var istanbulReport = require('gulp-istanbul-report');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var include = require("gulp-include");
var concat = require("gulp-concat");
var header = require("gulp-header");
var size = require("gulp-size");
var connect = require("gulp-connect");
var saucelabs = require("gulp-saucelabs");
var comment = '\/*\r\n* Moon v' + pkg.version + '\r\n* Copyright 2016-2017, Kabir Shah\r\n* https:\/\/github.com\/KingPixil\/moon\/\r\n* Free to use under the MIT license.\r\n* https:\/\/kingpixil.github.io\/license\r\n*\/\r\n';

// Build Moon
gulp.task('transpile', function () {
  return gulp.src(['./src/index.js'])
    .pipe(include())
    .pipe(babel({
      presets: ['transpile-moon']
    }))
    .pipe(concat('moon.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('build', ['transpile'], function () {
  return gulp.src(['./src/wrapper.js'])
    .pipe(include())
    .pipe(concat('moon.js'))
    .pipe(header(comment + '\n'))
    .pipe(replace('__VERSION__', pkg.version))
    .pipe(size())
    .pipe(gulp.dest('./dist/'));
});

// Build minified (compressed) version of Moon
gulp.task('minify', ['build'], function() {
  return gulp.src(['./dist/moon.js'])
    .pipe(uglify())
    .pipe(header(comment))
    .pipe(size())
    .pipe(concat('moon.min.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('instrument', function () {
	return gulp.src(['dist/moon.js'])
		.pipe(istanbul({
			coverageVariable: '__coverage__'
		}))
		.pipe(gulp.dest('coverage/'))
});


gulp.task('run-server', function () {
	connect.server({ port: 3000, root: './' });
});

gulp.task('stop-server', function () {
	connect.serverClose();
});

gulp.task('saucelabs', ['run-server'], function () {
  return saucelabs({
    urls: ['http://localhost:3000/test/test.html'],
    testname: 'Moon',
    framework: 'mocha',
    browsers: [
      {
        browserName: "MicrosoftEdge",
        platform: "Windows 10",
        version: "latest"
      }
    ],
    onTestSuiteComplete: (status) => {
      if(status) {
        console.log('[Moon] Browser Support Tests Passed');
      }
    }
  });
});

// Run Tests
gulp.task('basic-test', ['instrument'], function () {
    return gulp.src('test/test.html', {read:false})
      .pipe(mochaPhantomJS({
        phantomjs: {
          hooks: 'mocha-phantomjs-istanbul',
          coverageFile: './coverage/coverage.json',
          useColors: true
        },
        reporter: 'spec'
      }))
      .on('finish', function() {
        console.log('[Moon] Tests Passed\n');
        console.log('[Moon] Generating Coverage Report...');
        gulp.src('./coverage/coverage.json')
          .pipe(istanbulReport())
        console.log("[Moon] Generated Coverage Report");
      });
});

gulp.task('test', ['basic-test', 'saucelabs'], function() {
  gulp.start("stop-server");
});


// Default task
gulp.task('default', ['build', 'minify']);
