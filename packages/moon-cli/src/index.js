const fs = require("fs");
const path = require("path");
const https = require("https");
const exec = require("child_process").exec;

const parameterRE = /<\w+>/g;
const optionRE = /(?:^|\s)(?:\[\w+\]|--?\w+)/g;

const help = {
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
	console.log(`\x1b[34m${type}\x1b[0m ${message}`);
}

function logHelp(message) {
	console.log(highlight(message));
}

function logError(message) {
	console.log(`\x1b[31merror\x1b[0m ${message}`);
}

function highlight(string) {
	return string.replace(parameterRE, "\x1b[33m$&\x1b[0m").replace(optionRE, "\x1b[36m$&\x1b[0m");
}

function table(object) {
	const keys = Object.keys(object);
	const max = Math.max.apply(null, keys.map(key => key.length));
	return keys.map(key => "\t" + key + " ".repeat(max - key.length + 3) + object[key]).join("\n");
}

function replace(content, sub, subNewString) {
	const index = content.indexOf(sub);

	if (index === -1) {
		return content;
	} else {
		const left = content.slice(0, index);
		const right = replace(content.slice(index + sub.length), sub, subNewString);
		const subNew = Buffer.from(subNewString);

		return Buffer.concat([left, subNew, right], left.length + subNew.length + right.length);
	}
}

function download(name, repo) {
	const archive = {
		method: "GET",
		host: "api.github.com",
		path: `/repos/${repo}/tarball/master`,
		headers: {
			"User-Agent": "Moon"
		}
	};

	https.get(archive, res => {
		const statusCode = res.statusCode;

		if (statusCode >= 300 && statusCode < 400) {
			https.get(res.headers.location, res => {
				const statusCode = res.statusCode;

				if (statusCode >= 200 && statusCode < 300) {
					const archivePath = path.join(__dirname, "moon-template.tar.gz");
					const stream = fs.createWriteStream(archivePath);

					res.on("data", chunk => {
						stream.write(chunk);
					});

					res.on("end", () => {
						stream.end();

						log("downloaded", repo);
						install(name, archivePath);
					});
				} else {
					logError(`Invalid download HTTP response.

Attempted to download template:
	${res.headers.location}

Received error HTTP status code:
	${statusCode}

Expected success HTTP status code (200-299).`);
				}
			}).on("error", error => {
				logError(`Failed download HTTP request.

Attempted to download template:
	${res.headers.location}

Received error:
	${error}

Expected successful HTTP request.`);
			});
		} else {
			logError(`Invalid archive link HTTP response.

Attempted to fetch archive link for template:
	https://${archive.host}${archive.path}

Received error HTTP status code:
	${statusCode}

Expected redirect HTTP status code (300-399).`);
		}
	}).on("error", error => {
		logError(`Failed archive link HTTP request.

Attempted to fetch archive link for template:
	https://${archive.host}${archive.path}

Received error:
	${error}

Expected successful HTTP request.`);
	});
}

function install(name, archivePath) {
	const targetPath = path.join(process.cwd(), name);

	exec(`mkdir ${targetPath}`, error => {
		if (error !== null) {
			logError(`Failed directory creation.

Attempted to create directory:
	${targetPath}

Received error:
	${error}

Expected successful directory creation.`);
		}

		exec(`tar -xzf ${archivePath} -C ${targetPath} --strip=1`, error => {
			if (error !== null) {
				logError(`Failed archive extraction.

Attempted to extract archive to target:
	${archivePath} -> ${targetPath}

Received error:
	${error}

Expected successful archive extraction.`);
			}

			log("installed", targetPath);
			clean(name, archivePath, targetPath);
		});
	});
}

function clean(name, archivePath, targetPath) {
	fs.unlink(archivePath, error => {
		if (error !== null) {
			logError(`Failed archive deletion.

Attempted to delete archive:
	${archivePath}

Received error:
	${error}

Expected successful archive deletion.`);
		}

		log("cleaned", archivePath);
		processDirectory(name, targetPath, targetPath);
		log("created", `application \x1b[36m${name}\x1b[0m

To start, run:
	cd ${name}
	npm install
	npm run dev`);
	});
}

function processDirectory(name, directoryPath, targetPath) {
	const files = fs.readdirSync(directoryPath);

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const filePath = path.join(directoryPath, file);

		if (fs.statSync(filePath).isDirectory()) {
			processDirectory(name, filePath, targetPath);
		} else {
			fs.writeFileSync(filePath, replace(fs.readFileSync(filePath), "{# MoonName #}", name));
			log("processed", path.relative(targetPath, filePath));
		}
	}
}

const argv = process.argv.length === 2 ? ["help"] : process.argv.slice(2);
const commandName = argv[0];
const commandArguments = [];
const commandOptions = {};

for (let i = 1; i < argv.length; i++) {
	const commandArgument = argv[i];

	if (commandArgument[0] === "-") {
		for (; i < argv.length; i++) {
			const commandOption = argv[i];

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
	case "version": {
		logHelp(`Moon CLI v${process.env.MOON_VERSION}`);
		break;
	}

	case "help": {
		const commandNameHelp = commandArguments[0];

		if (commandNameHelp in help) {
			const helpCommand = help[commandNameHelp];

			logHelp(`Usage: ${helpCommand.usage}
	${helpCommand.description}`);

			if ("parameters" in helpCommand) {
				logHelp(`
Parameters:
${table(helpCommand.parameters)}`);
			}

			if ("options" in helpCommand) {
				logHelp(`
Options:
${table(helpCommand.options)}`);
			}
		} else {
			const tableUsageDescription = {};

			for (const command in help) {
				const helpCommand = help[command];
				tableUsageDescription[helpCommand.usage] = helpCommand.description;
			}

			logHelp(`Usage: moon <command> [options]

Commands:
${table(tableUsageDescription)}`);
		}
		break;
	}

	case "create": {
		const name = commandArguments[0];
		const repo = commandOptions["-t"] || commandOptions["--template"] || "kbrsh/moon-template";

		if (name === undefined || name.length === 0) {
			logError(`Invalid or unknown name.

Attempted to create an application.

Received an invalid or unknown name.

Expected a valid name. Run \x1b[35mmoon help create\x1b[0m to see usage information.`);
		}

		if (repo === true) {
			logError(`Invalid or unknown template.

Attempted to create an application.

Received an invalid or unknown template.

Expected a valid template. Run \x1b[35mmoon help create\x1b[0m to see usage information.`);
		}

		log("Moon", "creating application");
		download(name, repo);

		break;
	}

	default: {
		logError(`Unrecognized command.

Attempted to execute a command.

Received a command that does not exist:
	${commandName}

Expected a valid command. Run \x1b[35mmoon help\x1b[0m to see valid commands.`);
	}
}
