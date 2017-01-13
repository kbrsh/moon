var fs = require('fs');
var gutil = require('gulp-util');
var path = require('path');
var through = require('through');
var UglifyJS = require('uglify-js');

var File = gutil.File;
var PluginError = gutil.PluginError;

module.exports = function(filename, options) {
  'use strict';

  var baseFile = null;
  var basePath = '.';
  var sourcesContent = {};
  var toplevel = null;

  if (typeof filename === 'object') {
    // options given, but no filename
    options = filename;
    filename = null;
  }

  // Assign default values to options
  options = options || {};
  if (options.compress !== false) options.compress = options.compress || { warnings: false };
  if (options.mangle !== false) options.mangle = options.mangle || {};
  options.output = options.output || {};

  // Needed to get the relative paths correct in the source map
  if (options.basePath) {
    basePath = process.cwd() + path.sep + options.basePath;
  }

  function bufferFiles(file) {
    /* jshint validthis: true */
    if (file.isNull()) return;

    if (file.isStream()) {
      return this.emit('error', new PluginError('gulp-uglifyjs',  'Streaming not supported'));
    }

    if (!baseFile) {
      baseFile = file;

      // Set the filename if one wasn't given
      if (!filename) {
        filename = baseFile.relative;
      }

      // Set the outSourceMap filename if one was requested
      if (options.outSourceMap === true) {
        options.outSourceMap = filename + '.map';
      }
    }

    var code = file.contents.toString();

    sourcesContent[file.path] = code;

    try {
      toplevel = UglifyJS.parse(code, {
        filename: path.relative(basePath, file.path),
        toplevel: toplevel
      });
    } catch(e) {
      gutil.log('gulp-uglifyjs - UglifyJS threw an error');
      gutil.log(gutil.colors.red('file: ') + file.path + ':' + e.line + ',' + e.col);
      gutil.log(gutil.colors.red('error: ') + e.message);

      return this.emit('error', new PluginError('gulp-uglifyjs',  'Aborting due to previous errors'));
    }
  }

  function minify() {
    /* jshint validthis: true, camelcase: false */
    if(!toplevel) {
      gutil.log('gulp-uglifyjs - No files given; aborting minification');
      this.emit('end');
      return;
    }

    if (options.wrap) {
      toplevel = toplevel.wrap_commonjs(options.wrap, options.exportAll);
    }

    if (options.enclose) {
      var argParameterList = [];

      if (options.enclose !== true) {
        Object.keys(options.enclose).forEach(function(key) {
          argParameterList.push(key + ':' + options.enclose[key]);
        });
      }

      toplevel = toplevel.wrap_enclose(argParameterList);
    }

    toplevel.figure_out_scope();

    if (options.compress !== false) {
      var compressor = UglifyJS.Compressor(options.compress);
      toplevel = toplevel.transform(compressor);

      toplevel.figure_out_scope();
    }

    if (options.mangle !== false) {
      toplevel.compute_char_frequency();
      toplevel.mangle_names(options.mangle);
    }

    // Setup source map if one was requested
    if (options.outSourceMap) {
      options.output.source_map = options.output.source_map || {
        file: filename,
        root: options.sourceRoot || baseFile.cwd,
      };

      if (options.inSourceMap) {
        options.output.source_map.orig = fs.readFileSync(options.inSourceMap).toString();
      }

      var map = UglifyJS.SourceMap(options.output.source_map);
      options.output.source_map = map;

      if (options.sourceMapIncludeSources) {
        for (var file in sourcesContent) {
          if (sourcesContent.hasOwnProperty(file)) {
            options.output.source_map.get().setSourceContent(file, sourcesContent[file]);
          }
        }
      }
    }

    // Output the minified code
    var stream = UglifyJS.OutputStream(options.output);
    toplevel.print(stream);
    var min = stream.get();

    if (options.outSourceMap) {
      // Manually add source map comment to uglified code
      min += '\r\n//# sourceMappingURL=' + options.outSourceMap;
    }

    var compressedFile = new File({
      cwd: baseFile.cwd,
      base: baseFile.base,
      path: path.join(baseFile.base, filename),
      contents: new Buffer(min)
    });

    this.push(compressedFile);

    if (options.outSourceMap) {
      var sourceMap = new File({
        cwd: baseFile.cwd,
        base: baseFile.base,
        path: path.join(baseFile.base, options.outSourceMap),
        contents: new Buffer(options.output.source_map.toString())
      });

      this.push(sourceMap);
    }

    this.emit('end');
  }

  return through(bufferFiles, minify);
};
