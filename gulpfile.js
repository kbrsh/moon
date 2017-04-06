'use strict';

var gulp = require('gulp');
var pkg = require('./package.json');
var uglify = require("gulp-uglify");
var istanbul = require("gulp-istanbul");
var babel = require('gulp-babel');
var replace = require('gulp-replace');
var istanbulReport = require('gulp-istanbul-report');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var include = require("gulp-include");
var concat = require("gulp-concat");
var header = require("gulp-header");
var size = require("gulp-size");

var saucelabs = require('gulp-saucelabs');
var connect = require('gulp-connect');

var comment = `/**
 * Moon v${pkg.version}
 * Copyright 2016-2017 Kabir Shah
 * Released under the MIT License
 * http://moonjs.ga
 */\r\n`;

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
    .pipe(replace('__ENV__', "development"))
    .pipe(size())
    .pipe(gulp.dest('./dist/'));
});

// Build minified (compressed) version of Moon
gulp.task('minify', ['build'], function() {
  return gulp.src(['./dist/moon.js'])
    .pipe(replace('"development"', '"production"'))
    .pipe(uglify())
    .pipe(header(comment))
    .pipe(size())
    .pipe(size({
      gzip: true
    }))
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

// Run Tests
gulp.task('test', ['instrument'], function () {
    console.log("[Moon] Running Tests...");
    console.log("[Moon] Version: " + require("./dist/moon.min.js").version);
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

// Saucelabs
gulp.task('saucelabs', function() {
  return saucelabs({
    build: process.env.TRAVIS_JOB_ID,
    statusCheckAttempts: 500,
    urls: ['http://localhost:3000/test/test.html'],
    testname: 'Moon',
    framework: 'mocha',
    browsers: [
      {
        browserName: 'chrome',
        version: '46',
        platform: 'windows 7'
      },
      {
        browserName: 'chrome',
        version: '55',
        platform: 'windows 7'
      },
      {
        browserName: 'firefox',
        version: '45',
        platform: 'windows 7'
      },
      {
        browserName: 'internet explorer',
        version: '9'
      },
      {
        browserName: 'internet explorer',
        version: '10'
      },
      {
        browserName: 'internet explorer',
        version: '11',
        platform: 'windows 10'
      },
      {
        browserName: 'iphone',
        version: '8.4',
        platform: 'ios 10'
      },
      {
        browserName: 'android',
        version: '5.1',
        platform: 'latest'
      }
    ],
    onException: function(err) {
      console.log(err)
    }
  });
});

gulp.task('saucelabs:connect', function() {
    connect.server({ port: 3000, root: './' });
});

gulp.task('saucelabs:disconnect', () => {
    connect.serverClose();
});

gulp.task('test-saucelabs', ['saucelabs:connect', 'saucelabs'], () => gulp.start('saucelabs:disconnect'));

// Default task
gulp.task('default', ['build', 'minify']);
