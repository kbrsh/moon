'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var chalk = require('chalk');
var prettyBytes = require('pretty-bytes');
var StreamCounter = require('stream-counter');
var gzipSize = require('gzip-size');
var objectAssign = require('object-assign');

module.exports = function (opts) {
	opts = objectAssign({
		pretty: true,
		showTotal: true
	}, opts);

	var totalSize = 0;
	var fileCount = 0;

	function log(what, size) {
		var title = opts.title;
		title = title ? chalk.cyan(title) + ' ' : '';
		size = opts.pretty ? prettyBytes(size) : (size + ' B');
		gutil.log(title + what + ' ' + chalk.magenta(size) + (opts.gzip ? chalk.gray(' (gzipped)') : ''));
	}

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		var finish = function (err, size) {
			if (err) {
				cb(new gutil.PluginError('gulp-size', err));
				return;
			}

			totalSize += size;

			if (opts.showFiles === true && size > 0) {
				log(chalk.blue(file.relative), size);
			}

			fileCount++;
			cb(null, file);
		};

		if (file.isStream()) {
			if (opts.gzip) {
				file.contents.pipe(gzipSize.stream())
					.on('error', finish)
					.on('end', function () {
						finish(null, this.gzipSize);
					});
			} else {
				file.contents.pipe(new StreamCounter())
					.on('error', finish)
					.on('finish', function () {
						finish(null, this.bytes);
					});
			}

			return;
		}

		if (opts.gzip) {
			gzipSize(file.contents, finish);
		} else {
			finish(null, file.contents.length);
		}
	}, function (cb) {
		this.size = totalSize;
		this.prettySize = prettyBytes(totalSize);

		if (!(fileCount === 1 && opts.showFiles) && totalSize > 0 && fileCount > 0 && opts.showTotal) {
			log(chalk.green('all files'), totalSize);
		}

		cb();
	});
};
