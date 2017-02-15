/* jshint strict: false */
/* global before, after, describe, it */
var Buffer = require('buffer').Buffer,
    chai = require('chai'),
    File = require('gulp-util').File,
    fs = require('fs'),
    path = require('path'),
    uglify = require('../');

require('mocha');

var should = chai.should();

var seperator = '/';

var isWindows = process.platform === 'win32';
if (isWindows) {
  seperator = '\\\\';
}

var FILE_0_CONTENTS = 'function test1() { var asdf = 3; }',
    FILE_0_UGLIFIED = 'function test1(){}',
    FILE_0_UNCOMPRESSED = 'function test1(){var t=3}',
    FILE_0_ENCLOSED = '(function(){function t(){var t=3}})();',
    FILE_0_ENCLOSED_W_ARGS = '(function(t){function n(){var t=3}})(test);',
    FILE_0_ENCLOSED_W_MULTIPLE_ARGS = '(function(t,n){function t(){var t=3}})(test1,test2);',
    FILE_0_WRAPPED = '(function(t,n){n[\"test\"]=t;function u(){var t=3}})({},function(){return this}());',
    FILE_0_WRAPPED_W_EXPORT = '(function(t,n){n[\"test\"]=t;function u(){var t=3}t[\"test1\"]=u})({},function(){return this}());',
    FILE_0_UGLIFIED_WITH_SM = 'function test1(){}\r\n//# sourceMappingURL=test' + path.sep + 'file0.js.map';

var FILE_1_CONTENTS = 'function test2() { var qwerty = \'keyboard\'; return qwerty; }';

var FILE_0_1_UGLIFIED = 'function test1(){}function test2(){var t="keyboard";return t}',
    FILE_0_1_UGLIFIED_WITH_SM = 'function test1(){}function test2(){var t=\"keyboard\";return t}\r\n//# sourceMappingURL=test' + path.sep + 'file0.js.map',
    FILE_0_1_UNCOMPRESSED = 'function test1(){var t=3}function test2(){var t=\"keyboard\";return t}',
    FILE_0_1_UNMANGLED = 'function test1(){}function test2(){var qwerty=\"keyboard\";return qwerty}';

var FILE_0_SOURCE_MAP = '{"version":3,"file":"test' + seperator + 'file0.js","sources":["test' + seperator + 'file0.js"],"names":["test1"],"mappings":"AAAA,QAASA","sourceRoot":"."}',
    FILE_0_SOURCE_MAP_INCLUDE_SOURCES = '{"version":3,"file":"test' + seperator + 'file0.js","sources":["test' + seperator + 'file0.js"],"names":["test1"],"mappings":"AAAA,QAASA","sourceRoot":".","sourcesContent":["function test1() { var asdf = 3; }"]}',
    FILE_0_1_SOURCE_MAP = '{"version":3,"file":"test' + seperator + 'file0.js","sources":["test' + seperator + 'file0.js","test' + seperator + 'file1.js"],"names":["test1","test2","qwerty"],"mappings":"AAAA,QAASA,UCAT,QAASC,SAAU,GAAIC,GAAS,UAAY,OAAOA","sourceRoot":"."}';

function testFiles(stream, contents, expectedContents, expectedPaths) {
  it('should uglify one or several files', function(done) {
    var index = 0;

    stream.on('data', function(uglifiedFile){
      should.exist(uglifiedFile);
      should.exist(uglifiedFile.path);
      should.exist(uglifiedFile.relative);
      should.exist(uglifiedFile.contents);

      var newFilePath = path.resolve(uglifiedFile.path);
      var expectedFilePath = path.resolve(expectedPaths[index]);
      newFilePath.should.equal(expectedFilePath);

      String(uglifiedFile.contents).should.equal(expectedContents[index]);
      Buffer.isBuffer(uglifiedFile.contents).should.equal(true);

      index++;
    });

    stream.on('end', function() {
      done();
    });

    contents.forEach(function(contents, i) {
      stream.write(new File({
        cwd: '.',
        base: '.',
        path: 'test/file' + i.toString() + '.js',
        contents: new Buffer(contents)
      }));
    });

    stream.end();
  });
}

describe('gulp-uglifyjs', function() {
  before(function() {
    fs.writeFileSync('test/file0.js', [FILE_0_CONTENTS]);
    fs.writeFileSync('test/file1.js', [FILE_1_CONTENTS]);
  });

  after(function() {
    fs.unlinkSync('test/file0.js');
    fs.unlinkSync('test/file1.js');
  });

  describe('uglify()', function() {
    testFiles(uglify(), [FILE_0_CONTENTS], [FILE_0_UGLIFIED], ['test/file0.js']);
    testFiles(uglify(), [FILE_0_CONTENTS, FILE_1_CONTENTS], [FILE_0_1_UGLIFIED], ['test/file0.js']);

    it('should not fail when no file is given', function() {
      var stream = uglify();
      stream.write(new File({ contents: null }));
      stream.end();
    });
  });

  describe('uglify(filename)', function() {
    testFiles(uglify('test.js'), [FILE_0_CONTENTS], [FILE_0_UGLIFIED], ['test.js']);
    testFiles(uglify('test.js'), [FILE_0_CONTENTS, FILE_1_CONTENTS], [FILE_0_1_UGLIFIED], ['test.js']);
  });

  describe('uglify(filename, options)', function() {
    testFiles(uglify('test.js', { mangle: false }), [FILE_0_CONTENTS], [FILE_0_UGLIFIED], ['test.js']);
    testFiles(uglify('test.js', { mangle: false }), [FILE_0_CONTENTS, FILE_1_CONTENTS], [FILE_0_1_UNMANGLED], ['test.js']);
  });

  describe('uglify(options) with sourcemap', function() {
    testFiles(uglify({ outSourceMap: true }), [FILE_0_CONTENTS], [FILE_0_UGLIFIED_WITH_SM, FILE_0_SOURCE_MAP], ['test/file0.js', 'test/file0.js.map']);
    testFiles(uglify({ outSourceMap: true }), [FILE_0_CONTENTS, FILE_1_CONTENTS], [FILE_0_1_UGLIFIED_WITH_SM, FILE_0_1_SOURCE_MAP], ['test/file0.js', 'test/file0.js.map']);
  });

  describe('uglify(options) - no compress', function() {
    testFiles(uglify({ compress: false }), [FILE_0_CONTENTS], [FILE_0_UNCOMPRESSED], ['test/file0.js', 'test/file0.js.map']);
    testFiles(uglify({ compress: false }), [FILE_0_CONTENTS, FILE_1_CONTENTS], [FILE_0_1_UNCOMPRESSED], ['test/file0.js']);
  });

  describe('uglify(options) - no mangle', function() {
    testFiles(uglify({ mangle: false }), [FILE_0_CONTENTS], [FILE_0_UGLIFIED], ['test/file0.js']);
    testFiles(uglify({ mangle: false }), [FILE_0_CONTENTS, FILE_1_CONTENTS], [FILE_0_1_UNMANGLED], ['test/file0.js']);
  });

  describe('uglify(options) - enclose', function() {
    testFiles(uglify({ enclose: true, compress: false }), [FILE_0_CONTENTS], [FILE_0_ENCLOSED], ['test/file0.js']);
    testFiles(uglify({ enclose: { test: 'test' }, compress: false }), [FILE_0_CONTENTS], [FILE_0_ENCLOSED_W_ARGS], ['test/file0.js']);
    testFiles(uglify({ enclose: { test1: 'test1', test2: 'test2' }, compress: false }), [FILE_0_CONTENTS], [FILE_0_ENCLOSED_W_MULTIPLE_ARGS], ['test/file0.js']);
  });

  describe('uglify(options) - wrap', function() {
    testFiles(uglify({ wrap: 'test', compress: false }), [FILE_0_CONTENTS], [FILE_0_WRAPPED], ['test/file0.js']);
    testFiles(uglify({ wrap: 'test', compress: false, exportAll: true }), [FILE_0_CONTENTS], [FILE_0_WRAPPED_W_EXPORT], ['test/file0.js']);
  });

  describe('uglify(options) - sourceMapIncludeSources', function() {
    testFiles(uglify({ outSourceMap: true, sourceMapIncludeSources: true }), [FILE_0_CONTENTS], [FILE_0_UGLIFIED_WITH_SM, FILE_0_SOURCE_MAP_INCLUDE_SOURCES], ['test/file0.js', 'test/file0.js.map']);
  });

  describe('uglify() - error in code', function() {
    it('should throw an error on bad syntax', function() {
      var stream = uglify();

      try {
        stream.write(new File({
          cwd: '.',
          base: '.',
          path: 'test/file2.js',
          contents: new Buffer('function test() { badSyntax((); }')
        }));
      } catch (err) {
        err.message.should.equal('Aborting due to previous errors');
      }
    });
  });
});