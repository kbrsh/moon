var fs = require('fs');
var through = require('through');
var istanbul = require('istanbul');
var _ = require('lodash');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

module.exports = function(opts) {
  // set sensible default options
  var defaultDir = './coverage/';
  opts = _.defaults(opts || {}, {
    dir: defaultDir,
    reporters: ['text'],
    reporterOpts: {}
  });

  opts.reporterOpts = _.defaults(opts.reporterOpts, {
    dir: opts.dir || defaultDir
  });

  var collector = new istanbul.Collector();
  
  function collectFromFile(file) {
    if (file.isNull()) {
      return this.emit('error', new PluginError('gulp-istanbul-report', "Couldn't find coverage file " + file.path));
    }

    // we dont do streams (yet)
    if (file.isStream()) {
      return this.emit('error', new PluginError('gulp-istanbul-report', 'Streaming not supported'));
    }

    try {
      var coverage = JSON.parse(file.contents);
      collector.add(coverage);
    } catch (Exception) {
      return this.emit('error', new PluginError('gulp-istanbul-report', "Couldn't read coverage file " + file.path));
    }
  }

  function createReports() {
    // create reporters
    var reporters = opts.reporters.map(function (repOpts) {
      if (!_.isObject(repOpts)) {
        repOpts = {name: repOpts};
      }

      repOpts = _.defaults(repOpts, opts.reporterOpts);
      return istanbul.Report.create(repOpts.name || 'text', repOpts);
    });
    
    // write reports
    reporters.forEach(function (report) {
      report.writeReport(collector, true);
    });

    this.emit('end');
  }

  return through(collectFromFile, createReports);
};
