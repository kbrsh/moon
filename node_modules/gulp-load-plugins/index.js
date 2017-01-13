'use strict';
var hasGulplog = require('has-gulplog');
var micromatch = require('micromatch');
var unique = require('array-unique');
var findup = require('findup-sync');
var resolve = require('resolve');
var path = require('path');

function arrayify(el) {
  return Array.isArray(el) ? el : [el];
}

function camelize(str) {
  return str.replace(/-(\w)/g, function(m, p1) {
    return p1.toUpperCase();
  });
}

// code from https://github.com/gulpjs/gulp-util/blob/master/lib/log.js
// to use the same functionality as gulp-util for backwards compatibility
// with gulp 3x cli
function logger() {
  if (hasGulplog()) {
    // specifically deferring loading here to keep from registering it globally
    var gulplog = require('gulplog');
    gulplog.info.apply(gulplog, arguments);
  } else {
    // specifically defering loading because it might not be used
    var fancylog = require('fancy-log');
    fancylog.apply(null, arguments);
  }
}

module.exports = function(options) {
  var finalObject = {};
  var configObject;
  var requireFn;
  options = options || {};

  var DEBUG = options.DEBUG || false;
  var pattern = arrayify(options.pattern || ['gulp-*', 'gulp.*', '@*/gulp{-,.}*']);
  var config = options.config || findup('package.json', { cwd: parentDir });
  var scope = arrayify(options.scope || ['dependencies', 'devDependencies', 'peerDependencies']);
  var replaceString = options.replaceString || /^gulp(-|\.)/;
  var camelizePluginName = options.camelize !== false;
  var lazy = 'lazy' in options ? !!options.lazy : true;
  var renameObj = options.rename || {};

  logDebug('Debug enabled with options: ' + JSON.stringify(options));

  var renameFn = options.renameFn || function(name) {
    name = name.replace(replaceString, '');
    return camelizePluginName ? camelize(name) : name;
  };

  var postRequireTransforms = options.postRequireTransforms || {};

  if (typeof options.requireFn === 'function') {
    requireFn = options.requireFn;
  } else if (typeof config === 'string') {
    requireFn = function(name) {
      // This searches up from the specified package.json file, making sure
      // the config option behaves as expected. See issue #56.
      var src = resolve.sync(name, { basedir: path.dirname(config) });
      return require(src);
    };
  } else {
    requireFn = require;
  }

  configObject = (typeof config === 'string') ? require(config) : config;

  if (!configObject) {
    throw new Error('Could not find dependencies. Do you have a package.json file in your project?');
  }

  var names = scope.reduce(function(result, prop) {
    return result.concat(Object.keys(configObject[prop] || {}));
  }, []);

  logDebug(names.length + ' plugin(s) found: ' + names.join(' '));

  pattern.push('!gulp-load-plugins');

  function logDebug(message) {
    if (DEBUG) {
      logger('gulp-load-plugins: ' + message);
    }
  }

  function defineProperty(object, transform, requireName, name) {
    if (object[requireName]) {
      logDebug('error: defineProperty ' + name);
      throw new Error('Could not define the property "' + requireName + '", you may have repeated dependencies in your package.json like' + ' "gulp-' + requireName + '" and ' + '"' + requireName + '"');
    }

    if (lazy) {
      logDebug('lazyload: adding property ' + requireName);
      Object.defineProperty(object, requireName, {
        enumerable: true,
        get: function() {
          logDebug('lazyload: requiring ' + name + '...');
          return transform(requireName, requireFn(name));
        }
      });
    } else {
      logDebug('requiring ' + name + '...');
      object[requireName] = transform(requireName, requireFn(name));
    }
  }

  function getRequireName(name) {
    var requireName;

    if (renameObj[name]) {
      requireName = options.rename[name];
    } else {
      requireName = renameFn(name);
    }

    logDebug('renaming ' + name + ' to ' + requireName);

    return requireName;
  }

  function applyTransform(requireName, plugin) {
    var transform = postRequireTransforms[requireName];

    if (transform && typeof transform === 'function') { // if postRequireTransform function is passed, pass it the plugin and return it
      logDebug('transforming ' + requireName);
      return transform(plugin);
    } else {
      return plugin; // if no postRequireTransform function passed, return the plugin as is
    }
  }

  var scopeTest = new RegExp('^@');
  var scopeDecomposition = new RegExp('^@(.+)/(.+)');

  unique(micromatch(names, pattern)).forEach(function(name) {
    var decomposition;
    if (scopeTest.test(name)) {
      decomposition = scopeDecomposition.exec(name);

      if (!finalObject.hasOwnProperty(decomposition[1])) {
        finalObject[decomposition[1]] = {};
      }

      defineProperty(finalObject[decomposition[1]], applyTransform, getRequireName(decomposition[2]), name);
    } else {
      defineProperty(finalObject, applyTransform, getRequireName(name), name);
    }
  });

  return finalObject;
};

var parentDir = path.dirname(module.parent.filename);

// Necessary to get the current `module.parent` and resolve paths correctly.
delete require.cache[__filename];
