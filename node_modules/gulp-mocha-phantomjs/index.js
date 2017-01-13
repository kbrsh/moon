'use strict';

var fs = require('fs');
var path = require('path');
var url = require('url');
var spawn = require('child_process').spawn;
var through = require('through2');
var gutil = require('gulp-util');

var pluginName = require('./package.json').name;
var extend = require('./extend');

function mochaPhantomJS(options) {
    options = options || {};

    var scriptPath = lookup('mocha-phantomjs-core/mocha-phantomjs-core.js');

    if (!scriptPath) {
        throw new gutil.PluginError(pluginName, 'mocha-phantomjs-core.js not found');
    }

    return through.obj(function (file, enc, cb) {
        var args = [
            scriptPath,
            toURL(file.path, options.mocha),
            options.reporter || 'spec',
            JSON.stringify(options.phantomjs || {})
        ];

        spawnPhantomJS(args, options, this, function (err) {
            if (err) {
                return cb(err);
            }

            this.push(file);

            cb();
        }.bind(this));
    });
}

function toURL(path, query) {
    var parsed = url.parse(path, true);

    parsed.query = extend(parsed.query, query);
    parsed.search = null;

    if (['http:', 'https:', 'file:'].indexOf(parsed.protocol) > 0) {
        return url.format(parsed);
    } else {
        return fileURL(url.format(parsed));
    }
}

function fileURL(str) {
    var pathName = path.resolve(str).replace(/\\/g, '/');

    // for windows
    if (pathName[0] !== '/') {
        pathName = '/' + pathName;
    }

    return encodeURI('file://' + pathName);
}

function spawnPhantomJS(args, options, stream, cb) {
    // in case npm is started with --no-bin-links
    var phantomjsPath = lookup('.bin/phantomjs', true) || lookup('phantomjs-prebuilt/bin/phantomjs', true);

    if (!phantomjsPath) {
        return cb(new gutil.PluginError(pluginName, 'PhantomJS not found'));
    }

    var phantomjs = spawn(phantomjsPath, args);

    if (options.dump) {
        phantomjs.stdout.pipe(fs.createWriteStream(options.dump, {flags: 'a'}));
    }

    if (!options.suppressStdout) {
        phantomjs.stdout.pipe(process.stdout);
    }

    if (!options.suppressStderr) {
        phantomjs.stderr.pipe(process.stderr);
    }

    phantomjs.stdout.on('data', stream.emit.bind(stream, 'phantomjsStdoutData'));
    phantomjs.stdout.on('end', stream.emit.bind(stream, 'phantomjsStdoutEnd'));

    phantomjs.stderr.on('data', stream.emit.bind(stream, 'phantomjsStderrData'));
    phantomjs.stderr.on('end', stream.emit.bind(stream, 'phantomjsStderrEnd'));

    phantomjs.on('error', stream.emit.bind(stream, 'phantomjsError'));
    phantomjs.on('exit', stream.emit.bind(stream, 'phantomjsExit'));

    phantomjs.on('error', function (err) {
        cb(new gutil.PluginError(pluginName, err.message));
    });

    phantomjs.on('exit', function (code) {
        if (code === 0 || options.silent) {
            cb();
        } else {
            cb(new gutil.PluginError(pluginName, 'test failed. phantomjs exit code: ' + code));
        }
    });
}

function lookup(path, isExecutable) {
    for (var i = 0 ; i < module.paths.length; i++) {
        var absPath = require('path').join(module.paths[i], path);
        if (isExecutable && process.platform === 'win32') {
            absPath += '.cmd';
        }
        if (fs.existsSync(absPath)) {
            return absPath;
        }
    }
}

module.exports = mochaPhantomJS;
