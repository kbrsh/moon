#!/usr/bin/env node
/**
 * Moon CLI v1.0.0-beta.3
 * Copyright 2016-2019 Kabir Shah
 * Released under the MIT License
 * https://kbrsh.github.io/moon
 */
(function () {
	"use strict";

	var fs = require("fs");

	var path = require("path");

	var https = require("https");

	var exec = require("child_process").exec;

	var name = process.argv[2];
	var repo = process.argv[3] || "kbrsh/moon-template";
	var archive = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/" + repo + "/tarball/master",
		headers: {
			"User-Agent": "Node.js"
		}
	};

	function log(type, message) {
		console.log("\x1B[34m" + type + "\x1B[0m " + message);
	}

	function replace(content, sub, subNewString) {
		var index = content.indexOf(sub);

		if (index === -1) {
			return content;
		} else {
			var left = content.slice(0, index);
			var right = replace(content.slice(index + sub.length), sub, subNewString);
			var subNew = Buffer.from(subNewString);
			return Buffer.concat([left, subNew, right], left.length + subNew.length + right.length);
		}
	}

	function download(res) {
		var archivePath = path.join(__dirname, "moon-template.tar.gz");
		var stream = fs.createWriteStream(archivePath);
		res.on("data", function (chunk) {
			stream.write(chunk);
		});
		res.on("end", function () {
			stream.end();
			log("download", repo);
			install(archivePath);
		});
	}

	function install(archivePath) {
		var targetPath = path.join(process.cwd(), name);
		exec("mkdir " + targetPath, function (err) {
			if (err) throw err;
			exec("tar -xzf " + archivePath + " -C " + targetPath + " --strip=1", function (err) {
				if (err) throw err;
				log("install", targetPath);
				clean(archivePath, targetPath);
			});
		});
	}

	function clean(archivePath, targetPath) {
		fs.unlink(archivePath, function (err) {
			if (err) throw err;
			log("clean", archivePath);
			create(targetPath, targetPath);
			log("success", "Generated project \"" + name + "\"");
			console.log("To start, run:\n\tcd " + name + "\n\tnpm install\n\tnpm run dev");
		});
	}

	function create(currentPath, targetPath) {
		var files = fs.readdirSync(currentPath);

		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			var nextPath = path.join(currentPath, file);

			if (fs.statSync(nextPath).isDirectory()) {
				create(nextPath, targetPath);
			} else {
				fs.writeFileSync(nextPath, replace(fs.readFileSync(nextPath), "{# MoonName #}", name));
				log("create", path.relative(targetPath, nextPath));
			}
		}
	}

	log("Moon", "Generating project");
	https.get(archive, function (res) {
		if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location !== undefined) {
			https.get(res.headers.location, function (redirectRes) {
				download(redirectRes);
			});
		} else {
			download(res);
		}
	});

}());
