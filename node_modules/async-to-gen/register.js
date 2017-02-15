var asyncToGen = require('./index');

// Supported options:
//
//   - sourceMaps: Include inline source maps. (default: true)
//   - includes: A Regexp/String to determine which files should be transformed.
//               (alias: include)
//   - excludes: A Regexp/String to determine which files should not be
//               transformed, defaults to ignoring /node_modules/, provide null
//               to exclude nothing. (alias: exclude)
var options;
module.exports = function setOptions(newOptions) {
  options = newOptions;
}

// Swizzle Module#_compile on each applicable module instance.
// NOTE: if using alongside Babel or another require-hook which simply
// over-writes the require.extensions and does not continue execution, then
// this require hook must come after it. Encourage those module authors to call
// the prior loader in their require hooks.
var jsLoader = require.extensions['.js'];
var exts = [ '.js', '.jsx', '.flow', '.es6' ];
exts.forEach(function (ext) {
  var superLoader = require.extensions[ext] || jsLoader;
  require.extensions[ext] = function (module, filename) {
    if (shouldTransform(filename, options)) {
      var super_compile = module._compile;
      module._compile = function _compile(code, filename) {
        var sourceMaps = options && 'sourceMaps' in options ? options.sourceMaps : true;
        var result = asyncToGen(code, options);
        var code = result.toString();
        if (sourceMaps) {
          var map = result.generateMap();
          delete map.file;
          delete map.sourcesContent;
          map.sources[0] = filename;
          code += '\n//# sourceMappingURL=' + map.toUrl();
        }
        super_compile.call(this, code, filename);
      };
    }
    superLoader(module, filename);
  };
});

function shouldTransform(filename, options) {
  var includes = options && regexpPattern(options.includes || options.include);
  var excludes =
    options && 'excludes' in options ? regexpPattern(options.excludes) :
    options && 'exclude' in options ? regexpPattern(options.exclude) :
    /\/node_modules\//;
  return (!includes || includes.test(filename)) && !(excludes && excludes.test(filename));
}

// Given a null | string | RegExp | any, returns null | Regexp or throws a
// more helpful error.
function regexpPattern(pattern) {
  if (!pattern) {
    return pattern;
  }
  // A very simplified glob transform which allows passing legible strings like
  // "myPath/*.js" instead of a harder to read RegExp like /\/myPath\/.*\.js/.
  if (typeof pattern === 'string') {
    pattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
    if (pattern[0] !== '/') {
      pattern = '/' + pattern;
    }
    return new RegExp(pattern);
  }
  if (typeof pattern.test === 'function') {
    return pattern;
  }
  throw new Error(
    'async-to-gen: includes and excludes must be RegExp or path strings. Got: ' + pattern
  );
}
