var gutil = require("gulp-util"),
    should = require("should"),
    include = require("../index"),
    fs = require("fs"),
    vm = require("vm"),
    assert = require('stream-assert'),
    gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    path = require("path");


// TEST DESCRIPTIONS
describe("gulp-include", function () {
  describe("File including", function () {
    it("should replace special comments with file contents", function (done) {
      var file = new gutil.File({
        base: "test/fixtures/",
        path: "test/fixtures/js/basic-include.js",
        contents: fs.readFileSync("test/fixtures/js/basic-include.js")
      });

      testInclude = include();
      testInclude.on("data", function (newFile) {
        should.exist(newFile);
        should.exist(newFile.contents);

        String(newFile.contents).should.equal(String(fs.readFileSync("test/expected/js/basic-include.js"), "utf8"))
        done();
      });
      testInclude.write(file);
    });

    it("should keep whitespace when including", function (done) {
      var file = new gutil.File({
        base: "test/fixtures/",
        path: "test/fixtures/js/whitespace.js",
        contents: fs.readFileSync("test/fixtures/js/whitespace.js")
      });

      testInclude = include();
      testInclude.on("data", function (newFile) {
        should.exist(newFile);
        should.exist(newFile.contents);

        String(newFile.contents).should.equal(String(fs.readFileSync("test/expected/js/whitespace.js"), "utf8"))
        done();
      });
      testInclude.write(file);
    });

    it("should include complex folder trees", function (done) {
      var file = new gutil.File({
        base: "test/fixtures/",
        path: "test/fixtures/js/include-trees.js",
        contents: fs.readFileSync("test/fixtures/js/include-trees.js")
      });

      testInclude = include();
      testInclude.on("data", function (newFile) {
        should.exist(newFile);
        should.exist(newFile.contents);

        String(newFile.contents).should.equal(String(fs.readFileSync("test/expected/js/include-trees.js"), "utf8"))
        done();
      });
      testInclude.write(file);
    });
  })

  it("should not REQUIRE a file twice", function (done) {
    var file = new gutil.File({
      base: "test/fixtures/",
      path: "test/fixtures/js/big-dummy-project-file.js",
      contents: fs.readFileSync("test/fixtures/js/big-dummy-project-file.js")
    });

    testInclude = include();
    testInclude.on("data", function (newFile) {
      should.exist(newFile);
      should.exist(newFile.contents);

      String(newFile.contents).should.equal(String(fs.readFileSync("test/expected/js/big-dummy-project-file.js"), "utf8"))
      done();
    });
    testInclude.write(file);
  });

  it("should pull files recursively", function (done) {
    var file = new gutil.File({
      base: "test/fixtures/",
      path: "test/fixtures/js/recursive.js",
      contents: fs.readFileSync("test/fixtures/js/recursive.js")
    });

    testInclude = include();
    testInclude.on("data", function (newFile) {
      should.exist(newFile);
      should.exist(newFile.contents);

      String(newFile.contents).should.equal(String(fs.readFileSync("test/expected/js/recursive.js"), "utf8"))
      done();
    });
    testInclude.write(file);
  });

  it("should only include files with the set extensions, if provided", function (done) {
    var file = new gutil.File({
      base: "test/fixtures/",
      path: "test/fixtures/js/options-extensions.js",
      contents: fs.readFileSync("test/fixtures/js/options-extensions.js")
    });

    testInclude = include({
      extensions: ".txt"
    });
    testInclude.on("data", function (newFile) {
      should.exist(newFile);
      should.exist(newFile.contents);

      String(newFile.contents).should.equal(String(fs.readFileSync("test/expected/js/options-extensions.js"), "utf8"))
      done();
    });
    testInclude.write(file);
  });

  it("should work with html-comments", function(done) {
    var file = new gutil.File({
      base: "test/fixtures/",
      path: "test/fixtures/html/basic-include.html",
      contents: fs.readFileSync("test/fixtures/html/basic-include.html")
    });

    testInclude = include();
    testInclude.on("data", function (newFile) {
      should.exist(newFile);
      should.exist(newFile.contents);

      String(newFile.contents).should.equal(String(fs.readFileSync("test/expected/html/basic-include-output.html"), "utf8"))
      done();
    });
    testInclude.write(file);
  })

  it('should support source maps', function (done) {
    gulp.src('test/fixtures/js/basic-include.js')
      .pipe(sourcemaps.init())
      .pipe(include())
      .pipe(assert.length(1))
      .pipe(assert.first(function (d) {
        d.sourceMap.sources.should.have.length(3);
        d.sourceMap.file.should.eql('basic-include.js');
        d.sourceMap.sources.should.eql(['basic-include.js', 'deep_path/b.js', 'deep_path/deeper_path/c.js'])
      }))
      .pipe(assert.end(done));
  });

  it('should strip unicode byte order marks from included files', function (done) {
    var file = new gutil.File({
      base: "test/fixtures/",
      path: "test/fixtures/html/basic-include-with-unicode-BOM.html",
      contents: fs.readFileSync("test/fixtures/html/basic-include-with-unicode-BOM.html")
    });

    testInclude = include();
    testInclude.on("data", function (newFile) {
      should.exist(newFile);
      should.exist(newFile.contents);

      String(newFile.contents).should.equal(String(fs.readFileSync("test/expected/html/basic-include-output-with-unicode-BOM.html"), "utf8"))
      done();
    });

    testInclude.write(file);
  })

  it("should include from set includePaths", function(done) {
    var file = new gutil.File({
      base: "test/fixtures/",
      path: "test/fixtures/js/include-path.js",
      contents: fs.readFileSync("test/fixtures/js/include-path.js")
    });

    testInclude = include({
      includePaths: [
        __dirname + "/fixtures/js/include-path",
        __dirname + "/fixtures/js/include-path2",
        __dirname + "/fixtures/js/include-path2/deeper2",
      ]
    });
    testInclude.on("data", function (newFile) {
      should.exist(newFile);
      should.exist(newFile.contents);

      String(newFile.contents).should.equal(String(fs.readFileSync("test/expected/js/include-path.js"), "utf8"))
      done();
    });
    testInclude.write(file);
  })

  it("should throw an error if no match is found with hardFail: true", function(done) {
    var file = new gutil.File({
      base: "test/fixtures/",
      path: "test/fixtures/js/include-fail.js",
      contents: fs.readFileSync("test/fixtures/js/include-fail.js")
    });

    testInclude = include({
      hardFail: true
    });
    testInclude.on("error", function(err) {
      if (err) done();
    });
    testInclude.write(file);
  })

  it("should not throw an error if no match is found with hardFail: false", function(done) {
    var file = new gutil.File({
      base: "test/fixtures/",
      path: "test/fixtures/js/include-fail.js",
      contents: fs.readFileSync("test/fixtures/js/include-fail.js")
    });

    testInclude = include({
      hardFail: false
    });
    testInclude.on("error", function(err) {
      done(err);
    });
    testInclude.on("data", function(newFile) {
      done();
    });
    testInclude.write(file);
  })
})
