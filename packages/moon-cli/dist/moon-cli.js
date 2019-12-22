#!/usr/bin/env node
/**
 * Moon CLI v1.0.0-beta.4
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

	var parameterRE = /<\w+>/g;
	var optionRE = /(?:^|\s)(?:\[\w+\]|--?\w+)/g;
	var help = {
		version: {
			usage: "moon version",
			description: "output Moon CLI version"
		},
		help: {
			usage: "moon help <command>",
			description: "output help message for command",
			parameters: {
				"<command>": "name of Moon CLI command"
			}
		},
		create: {
			usage: "moon create <name> [options]",
			description: "create application in new directory",
			parameters: {
				"<name>": "name of application and directory"
			},
			options: {
				"-t, --template <username>/<repository>": "GitHub repository to use as template"
			}
		}
	};

	function log(type, message) {
		console.log("\x1B[34m" + type + "\x1B[0m " + message);
	}

	function logHelp(message) {
		console.log(highlight(message));
	}

	function logError(message) {
		console.log("\x1B[31merror\x1B[0m " + message);
	}

	function highlight(string) {
		return string.replace(parameterRE, "\x1b[33m$&\x1b[0m").replace(optionRE, "\x1b[36m$&\x1b[0m");
	}

	function table(object) {
		var keys = Object.keys(object);
		var max = Math.max.apply(null, keys.map(function (key) {
			return key.length;
		}));
		return keys.map(function (key) {
			return "\t" + key + " ".repeat(max - key.length + 3) + object[key];
		}).join("\n");
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

	function download(name, repo) {
		var archive = {
			method: "GET",
			host: "api.github.com",
			path: "/repos/" + repo + "/tarball/master",
			headers: {
				"User-Agent": "Moon"
			}
		};
		https.get(archive, function (res) {
			var statusCode = res.statusCode;

			if (statusCode >= 300 && statusCode < 400) {
				https.get(res.headers.location, function (res) {
					var statusCode = res.statusCode;

					if (statusCode >= 200 && statusCode < 300) {
						var archivePath = path.join(__dirname, "moon-template.tar.gz");
						var stream = fs.createWriteStream(archivePath);
						res.on("data", function (chunk) {
							stream.write(chunk);
						});
						res.on("end", function () {
							stream.end();
							log("downloaded", repo);
							install(name, archivePath);
						});
					} else {
						logError("Invalid download HTTP response.\n\nAttempted to download template:\n\t" + res.headers.location + "\n\nReceived error HTTP status code:\n\t" + statusCode + "\n\nExpected success HTTP status code (200-299).");
					}
				}).on("error", function (error) {
					logError("Failure of download HTTP request.\n\nAttempted to download template:\n\t" + res.headers.location + "\n\nReceived error:\n\t" + error + "\n\nExpected successful HTTP request.");
				});
			} else {
				logError("Invalid archive link HTTP response.\n\nAttempted to fetch archive link for template:\n\thttps://" + archive.host + archive.path + "\n\nReceived error HTTP status code:\n\t" + statusCode + "\n\nExpected redirect HTTP status code (300-399).");
			}
		}).on("error", function (error) {
			logError("Failure of archive link HTTP request.\n\nAttempted to fetch archive link for template:\n\thttps://" + archive.host + archive.path + "\n\nReceived error:\n\t" + error + "\n\nExpected successful HTTP request.");
		});
	}

	function install(name, archivePath) {
		var targetPath = path.join(process.cwd(), name);
		exec("mkdir " + targetPath, function (error) {
			if (error) logError(error);
			exec("tar -xzf " + archivePath + " -C " + targetPath + " --strip=1", function (error) {
				if (error) logError(error);
				log("installed", targetPath);
				clean(name, archivePath, targetPath);
			});
		});
	}

	function clean(name, archivePath, targetPath) {
		fs.unlink(archivePath, function (error) {
			if (error) logError(error);
			log("cleaned", archivePath);
			processDirectory(name, targetPath, targetPath);
			log("created", "application \x1B[36m" + name + "\x1B[0m\n\nTo start, run:\n\tcd " + name + "\n\tnpm install\n\tnpm run dev");
		});
	}

	function processDirectory(name, directoryPath, targetPath) {
		var files = fs.readdirSync(directoryPath);

		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			var filePath = path.join(directoryPath, file);

			if (fs.statSync(filePath).isDirectory()) {
				processDirectory(name, filePath, targetPath);
			} else {
				fs.writeFileSync(filePath, replace(fs.readFileSync(filePath), "{# MoonName #}", name));
				log("processed", path.relative(targetPath, filePath));
			}
		}
	}

	var argv = process.argv.length === 2 ? ["help"] : process.argv.slice(2);
	var commandName = argv[0];
	var commandArguments = [];
	var commandOptions = {};

	for (var i = 1; i < argv.length; i++) {
		var commandArgument = argv[i];

		if (commandArgument[0] === "-") {
			for (; i < argv.length; i++) {
				var commandOption = argv[i];

				if (commandOption[0] === "-") {
					commandOptions[commandOption] = true;
				} else {
					commandOptions[argv[i - 1]] = commandOption;
				}
			}
		} else {
			commandArguments.push(commandArgument);
		}
	}

	switch (commandName) {
		case "version":
			{
				logHelp("Moon CLI v" + "1.0.0-beta.4");
				break;
			}

		case "help":
			{
				var commandNameHelp = commandArguments[0];

				if (commandNameHelp in help) {
					var helpCommand = help[commandNameHelp];
					logHelp("Usage: " + helpCommand.usage + "\n\t" + helpCommand.description);

					if ("parameters" in helpCommand) {
						logHelp("\nParameters:\n" + table(helpCommand.parameters));
					}

					if ("options" in helpCommand) {
						logHelp("\nOptions:\n" + table(helpCommand.options));
					}
				} else {
					var tableUsageDescription = {};

					for (var command in help) {
						var _helpCommand = help[command];
						tableUsageDescription[_helpCommand.usage] = _helpCommand.description;
					}

					logHelp("Usage: moon <command> [options]\n\nCommands:\n" + table(tableUsageDescription));
				}

				break;
			}

		case "create":
			{
				var name = commandArguments[0];
				var repo = commandOptions["-t"] || commandOptions["--template"] || "kbrsh/moon-template";

				if (name === undefined || name.length === 0) {
					logError("Invalid or unknown name.\n\nAttempted to create an application.\n\nReceived an invalid or unknown name.\n\nExpected a valid name. Run \x1B[35mmoon help create\x1B[0m to see usage information.");
				}

				if (repo === true) {
					logError("Invalid or unknown template.\n\nAttempted to create an application.\n\nReceived an invalid or unknown template.\n\nExpected a valid template. Run \x1B[35mmoon help create\x1B[0m to see usage information.");
				}

				log("Moon", "creating application");
				download(name, repo);
				break;
			}

		default:
			{
				logError("Unrecognized command.\n\nAttempted to execute a command.\n\nReceived a command that does not exist:\n\t" + commandName + "\n\nExpected a valid command. Run \x1B[35mmoon help\x1B[0m to see valid commands.");
			}
	}

}());
