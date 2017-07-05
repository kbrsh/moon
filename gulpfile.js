'use strict';

// Gulp
const gulp = require('gulp');

// Javascript transpiler
const buble = require('buble');

// Javascript minifier
const uglify = require("gulp-uglify");

// Replacer to replace keywords
const replace = require('gulp-replace');

// Utility to include files
const include = require("gulp-include");

// Utility to concat files
const concat = require("gulp-concat");

// Utility to append header to file
const header = require("gulp-header");

// Display size of file
const size = require("gulp-size");

// Transform
const Transform = require("stream").Transform;

// Karma server
const Server = require('karma').Server;

// Package information
const pkg = require('./package.json');

// Header comment
const comment = `/**
 * Moon v${pkg.version}
 * Copyright 2016-2017 Kabir Shah
 * Released under the MIT License
 * http://moonjs.ga
 */\r\n`;

// Gulp Buble Plugin
const gulpBuble = function(options) {
  return new Transform({
    objectMode: true,
    transform: function(file, encoding, callback) {
      if(!file.isStream()) {
        if(options === undefined) {
          options = {};
        }

        let result = null;
        try {
          result = buble.transform(file.contents.toString(), options);
        } catch(e) {
          throw new Error("[Buble] Error: " + e);
        }

        file.contents = new Buffer(result.code);

        callback(null, file);
      }
    }
  });
};

// Build Moon
gulp.task('transpile', function() {
  return gulp.src(['./src/index.js'])
    .pipe(include())
    .pipe(gulpBuble({
      namedFunctionExpressions: false,
      transforms: {
        arrow: true,
        classes: false,
        collections: false,
        computedProperty: false,
        conciseMethodProperty: false,
        constLoop: false,
        dangerousForOf: false,
        dangerousTaggedTemplateString: false,
        defaultParameter: false,
        destructuring: false,
        forOf: false,
        generator: false,
        letConst: true,
        modules: false,
        numericLiteral: false,
        parameterDestructuring: false,
        reservedProperties: false,
        spreadRest: false,
        stickyRegExp: false,
        templateString: true,
        unicodeRegExp: false
      }
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
