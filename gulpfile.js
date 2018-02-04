"use strict";

// Gulp
const gulp = require("gulp");

// Javascript bundler and transpiler
const rollup = require("rollup-stream");
const buble = require("rollup-plugin-buble");
const stream = require("vinyl-source-stream");

// Javascript minifier
const uglifyJS = require("uglify-js");
const composer = require("gulp-uglify/composer");
const uglify = composer(uglifyJS, console);

// Replacer to replace keywords
const replace = require("gulp-replace");

// Utility to include files
const include = require("gulp-include");

// Utility to concat files
const concat = require("gulp-concat");

// Utility to append header to file
const header = require("gulp-header");

// Display size of file
const size = require("gulp-size");

// Karma server
const Server = require("karma").Server;

// Package information
const pkg = require("./package.json");

// Header comment
const comment = `/**
 * Moon v${pkg.version}
 * Copyright 2016-2018 Kabir Shah
 * Released under the MIT License
 * http://moonjs.ga
 */\r\n`;


// Build Moon
gulp.task("build", function() {
  return rollup({
    input: "./src/index.js",
    format: "umd",
    name: "Moon",
    plugins: [buble({
      namedFunctionExpressions: false,
      transforms: {
        arrow: true,
        classes: false,
        collections: false,
        computedProperty: false,
        conciseMethodProperty: true,
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
    })]
  })
    .pipe(stream("moon.js"))
    .pipe(header(comment + "\n"))
    .pipe(replace("__VERSION__", pkg.version))
    .pipe(replace("__ENV__", "development"))
    .pipe(gulp.dest("./dist/"))
});

// Build minified (compressed) version of Moon
gulp.task("minify", ["build"], function() {
  return gulp.src(["./dist/moon.js"])
    .pipe(replace("\"development\"", "\"production\""))
    .pipe(uglify())
    .pipe(header(comment))
    .pipe(concat("moon.min.js"))
    .pipe(gulp.dest("./dist/"))
    .pipe(size())
    .pipe(size({
      gzip: true
    }));
});

gulp.task("es6", function() {
  return rollup({
    input: "./src/index.js",
    format: "es",
  })
    .pipe(stream("moon.esm.js"))
    .pipe(header(comment + "\n"))
    .pipe(replace("__VERSION__", pkg.version))
    .pipe(replace("__ENV__", "production"))
    .pipe(gulp.dest("./dist/"))
    .pipe(size());
});

gulp.task("es6-dev", ["es6"], function() {
  return gulp.src(["./dist/moon.esm.js"])
    .pipe(replace("\"development\"", "\"production\""))
    .pipe(concat("moon.esm.dev.js"))
    .pipe(gulp.dest("./dist/"))
});

// Run Tests
gulp.task("test", function(done) {
    console.log("[Moon] Running Tests...");
    console.log("[Moon] Version: " + require("./dist/moon.min.js").version);
    new Server({
      configFile: __dirname + "/test/karma.conf.js",
      singleRun: true
    }, done).start();
});

// Saucelabs
gulp.task("test-saucelabs", function(done) {
  new Server({
    configFile: __dirname + "/test/karma.sauce.conf.js",
    singleRun: true
  }, done).start();
});

// Default task
gulp.task("default", ["build", "minify", "es6", "es6-dev"]);
