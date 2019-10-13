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
	var optionRE = /\[\w+\]|--?\w+/g;
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
	var repo, name;

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

	function log(type, message) {
		console.log("\x1B[34m" + type + "\x1B[0m " + message);
	}

	function logHelp(message) {
		console.log(highlight(message));
	}

	function error(message) {
		console.log("\x1B[31merror\x1B[0m " + message);
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
			log("success", "Generated application \x1B[36m" + name + "\x1B[0m");
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
				name = commandArguments[0];
				repo = commandOptions["-t"] || commandOptions["--template"] || "kbrsh/moon-template";

				if (name === undefined || name.length === 0) {
					error("Invalid or unknown name.\n\nAttempted to create an application.\n\nReceived an invalid or unknown name.\n\nExpected a valid name. Run \x1B[35mmoon help create\x1B[0m to see usage information.");
				}

				if (repo === true) {
					error("Invalid or unknown template.\n\nAttempted to create an application.\n\nReceived an invalid or unknown template.\n\nExpected a valid template. Run \x1B[35mmoon help create\x1B[0m to see usage information.");
				}

				var archive = {
					method: "GET",
					host: "api.github.com",
					path: "/repos/" + repo + "/tarball/master",
					headers: {
						"User-Agent": "Moon"
					}
				};
				log("Moon", "Generating application");
				https.get(archive, function (res) {
					if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location !== undefined) {
						https.get(res.headers.location, function (redirectRes) {
							download(redirectRes);
						});
					} else {
						download(res);
					}
				});
				break;
			}

		default:
			{
				error("Unrecognized command.\n\nAttempted to execute a command.\n\nReceived a command that does not exist:\n\t" + commandName + "\n\nExpected a valid command. Run \x1B[35mmoon help\x1B[0m to see valid commands.");
				break;
			}
	}

}());
