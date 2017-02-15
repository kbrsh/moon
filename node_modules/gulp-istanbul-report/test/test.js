var fs = require('fs');
var array = require('stream-array');
var File = require('gulp-util').File;
var istanbulReport = require('../');
var gulp = require('gulp');
var expect = require('chai').expect;
var del = require('del');

describe('gulp-istanbul-report', function() {

  function cleanOutput(cb) {
    del('./test/output/', cb);
  }

  beforeEach(cleanOutput);
  afterEach(cleanOutput);
  
  it('should work without any config', function(done) {
    gulp.src('./test/coverage.json')
      .pipe(istanbulReport())
      .on('end', function() {
        done();
      });
  });

  it('should write the report', function(done) {
    gulp.src('./test/coverage.json')
      .pipe(istanbulReport({
        dir: './test/output',
        reporterOpts: {
          file: 'default.json'
        },
        reporters: [
          'json',
          {name: 'text-summary', file: 'summary.txt'}
        ]
      }).on('end', function() {
        var jsonIn = JSON.parse(fs.readFileSync('./test/coverage.json'));
        var jsonOut = JSON.parse(fs.readFileSync('./test/output/default.json'));
        expect(jsonOut).to.deep.equal(jsonIn);
        
        var textOut = fs.readFileSync('./test/output/summary.txt', 'utf-8');
        expect(textOut).to.contain('Statements   : 100% ( 5/5 )');

        done();
      }));
  }); 
});


