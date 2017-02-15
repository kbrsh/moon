'use strict';

var through = require('through2').obj;
var path = require('path');
var checker = require('istanbul-threshold-checker');
// Make sure istanbul is `require`d after the istanbul-threshold-checker to use the istanbul version
// defined in this package.json instead of the one defined in istanbul-threshold-checker.
var istanbul = require('istanbul');
var gutil = require('gulp-util');
var _ = require('lodash');
var applySourceMap = require('vinyl-sourcemaps-apply');
var Report = istanbul.Report;
var Collector = istanbul.Collector;
var PluginError = gutil.PluginError;

var PLUGIN_NAME = 'gulp-istanbul';
var COVERAGE_VARIABLE = '$$cov_' + new Date().getTime() + '$$';

function normalizePathSep(filepath) {
  return filepath.replace(/\//g, path.sep);
}

var plugin = module.exports = function (opts) {
  opts = opts || {};
  _.defaults(opts, {
    coverageVariable: COVERAGE_VARIABLE,
    instrumenter: istanbul.Instrumenter
  });
  opts.includeUntested = opts.includeUntested === true;

  return through(function (file, enc, cb) {
    var fileContents = file.contents.toString();
    var fileOpts = _.cloneDeep(opts);

    if (file.sourceMap) {
      fileOpts = _.defaultsDeep(fileOpts, {
        codeGenerationOptions: {
          sourceMap: file.sourceMap.file,
          sourceMapWithCode: true,
          sourceContent: fileContents,
          sourceMapRoot: file.sourceMap.sourceRoot,
          file: normalizePathSep(file.path)
        }
      });
    }
    var instrumenter = new opts.instrumenter(fileOpts);

    cb = _.once(cb);
    if (!(file.contents instanceof Buffer)) {
      return cb(new PluginError(PLUGIN_NAME, 'streams not supported'));
    }

    var filepath = normalizePathSep(file.path);
    instrumenter.instrument(fileContents, filepath, function (err, code) {
      if (err) {
        return cb(new PluginError(
          PLUGIN_NAME,
          'Unable to parse ' + filepath + '\n\n' + err.message + '\n'
        ));
      }

      var sourceMap = instrumenter.lastSourceMap();
      if (sourceMap !== null) {
          applySourceMap(file, sourceMap.toString());
      }

      file.contents = new Buffer(code);

      // Parse the blank coverage object from the instrumented file and save it
      // to the global coverage variable to enable reporting on non-required
      // files, a workaround for
      // https://github.com/gotwarlost/istanbul/issues/112
      if (opts.includeUntested) {
        var instrumentedSrc = file.contents.toString();
        var covStubRE = /\{.*"path".*"fnMap".*"statementMap".*"branchMap".*\}/g;
        var covStubMatch = covStubRE.exec(instrumentedSrc);
        if (covStubMatch !== null) {
          var covStub = JSON.parse(covStubMatch[0]);
          global[opts.coverageVariable] = global[opts.coverageVariable] || {};
          global[opts.coverageVariable][path.resolve(filepath)] = covStub;
        }
      }

      return cb(err, file);
    });
  });
};

plugin.hookRequire = function (options) {
  var fileMap = {};

  istanbul.hook.unhookRequire();
  istanbul.hook.hookRequire(function (path) {
    return !!fileMap[normalizePathSep(path)];
  }, function (code, path) {
    return fileMap[normalizePathSep(path)];
  }, options);

  return through(function (file, enc, cb) {
    // If the file is already required, delete it from the cache otherwise the covered
    // version will be ignored.
    delete require.cache[path.resolve(file.path)];
    fileMap[normalizePathSep(file.path)] = file.contents.toString();
    return cb();
  });
};

plugin.summarizeCoverage = function (opts) {
  opts = opts || {};
  if (!opts.coverageVariable) opts.coverageVariable = COVERAGE_VARIABLE;

  if (!global[opts.coverageVariable]) throw new Error('no coverage data found, run tests before calling `summarizeCoverage`');

  var collector = new Collector();
  collector.add(global[opts.coverageVariable]);
  return istanbul.utils.summarizeCoverage(collector.getFinalCoverage());
};

plugin.writeReports = function (opts) {
  if (typeof opts === 'string') opts = { dir: opts };
  opts = opts || {};

  var defaultDir = path.join(process.cwd(), 'coverage');
  opts = _.defaultsDeep(opts, {
    coverageVariable: COVERAGE_VARIABLE,
    dir: defaultDir,
    reportOpts: {
      dir: opts.dir || defaultDir
    }
  });
  opts.reporters = opts.reporters || [ 'lcov', 'json', 'text', 'text-summary' ];

  var reporters = opts.reporters.map(function(reporter) {
    if (reporter.TYPE) Report.register(reporter);
    return reporter.TYPE || reporter;
  });

  var invalid = _.difference(reporters, Report.getReportList());
  if (invalid.length) {
    // throw before we start -- fail fast
    throw new PluginError(PLUGIN_NAME, 'Invalid reporters: ' + invalid.join(', '));
  }

  reporters = reporters.map(function (r) {
    var reportOpts = opts.reportOpts[r] || opts.reportOpts;
    return Report.create(r, _.clone(reportOpts));
  });

  var cover = through();

  cover.on('end', function () {
    var collector = new Collector();

    // Revert to an object if there are no matching source files.
    collector.add(global[opts.coverageVariable] || {});

    reporters.forEach(function (report) {
      report.writeReport(collector, true);
    });
  }).resume();

  return cover;
};

plugin.enforceThresholds = function (opts) {
  opts = opts || {};
  opts = _.defaults(opts, {
    coverageVariable: COVERAGE_VARIABLE
  });

  var cover = through();

  cover.on('end', function () {
    var collector = new Collector();

    // Revert to an object if there are no macthing source files.
    collector.add(global[opts.coverageVariable] || {});

    var results = checker.checkFailures(opts.thresholds, collector.getFinalCoverage());
    var criteria = function(type) {
      return (type.global && type.global.failed) || (type.each && type.each.failed);
    };

    if (_.some(results, criteria)) {
      this.emit('error', new PluginError({
        plugin: PLUGIN_NAME,
        message: 'Coverage failed'
      }));
    }

  }).resume();

  return cover;
};
