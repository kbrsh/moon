'use strict';

var gulp = require('gulp');
var pkg = require('./package.json');
var uglify = require("gulp-uglify");
var babel = require('gulp-babel');
var replace = require('gulp-replace');
var Server = require('karma').Server;
var include = require("gulp-include");
var concat = require("gulp-concat");
var header = require("gulp-header");
var size = require("gulp-size");

var comment = `/**
 * Moon v${pkg.version}
 * Copyright 2016-2017 Kabir Shah
 * Released under the MIT License
 * http://moonjs.ga
 */\r\n`;

// Build Moon
gulp.task('transpile', function() {
  return gulp.src(['./src/index.js'])
    .pipe(include())
    .pipe(babel({
      presets: ['transpile-moon']
    }))
    .pipe(concat('moon.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('build', ['transpile'], function() {
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

// Run Tests
gulp.task('test', function(done) {
    console.log("[Moon] Running Tests...");
    console.log("[Moon] Version: " + require("./dist/moon.min.js").version);
    new Server({
      configFile: __dirname + '/test/karma.conf.js',
      singleRun: true
    }, done).start();
});

// Saucelabs
gulp.task('test-saucelabs', function(done) {
  new Server({
    configFile: __dirname + '/test/karma.sauce.conf.js',
    singleRun: true
  }, done).start();
});

// Default task
gulp.task('default', ['build', 'minify']);
