var _ = require('lodash');
var gulp = require('gulp');
var gulpIstanbul = require('gulp-istanbul');
var jscs = require('gulp-jscs');
var mocha = require('gulp-mocha');
var reporter = require('istanbul-text-full-reporter');

var files = ['*.js', 'lib/**/*.js', '!gulpfile.js'];
var tests = ['test/**/*.js'];

gulp.task('standards', function() {
    return gulp.src(files.concat(tests)).pipe(jscs());
});

gulp.task('test', function(cb) {
    return gulp.src(tests).pipe(mocha());
});

gulp.task('coverage', function(cb) {
    return gulp.src(files)
        .pipe(gulpIstanbul({ includeUntested: true }))
        .pipe(gulpIstanbul.hookRequire())
        .on('end', function() {
            gulp.src(tests)
                .pipe(mocha())
                .on('error', cb)
                .pipe(gulpIstanbul.writeReports({ reporters: [reporter] }))
        });
});
