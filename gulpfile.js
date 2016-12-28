'use strict';

var gulp = require('gulp');
var pkg = require('./package.json');
var uglify = require("gulp-uglifyjs")
var comment = '\/*\r\n* Moon ' + pkg.version + '\r\n* Copyright 2016, Kabir Shah\r\n* https:\/\/github.com\/KingPixil\/moon\/\r\n* Free to use under the MIT license.\r\n* https:\/\/kingpixil.github.io\/license\r\n*\/\r\n';
var $ = require('gulp-load-plugins')();

gulp.task('build', function () {
  return gulp.src(['./src/index.js'])
    .pipe($.include())
    .pipe($.concat('moon.js'))
    .pipe($.header(comment + '\n'))
    .pipe($.size())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('minify', ['build'], function() {
  return gulp.src(['./dist/moon.js'])
    .pipe(uglify())
    .pipe($.header(comment))
    .pipe($.size())
    .pipe($.concat('moon.min.js'))
    .pipe(gulp.dest('./dist/'));
});



gulp.task('default', ['build', 'minify']);
