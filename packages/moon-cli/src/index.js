const fs = require("fs");
const path = require("path");
const https = require("https");
const exec = require("child_process").exec;

const parameterRE = /<\w+>/g;
const optionRE = /\[\w+\]|--?\w+/g;

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

let repo, name;

function highlight(string) {
	return string.replace(parameterRE, "\x1b[33m$&\x1b[0m").replace(optionRE, "\x1b[36m$&\x1b[0m");
}

function table(object) {
	const keys = Object.keys(object);
	const max = Math.max.apply(null, keys.map(key => key.length));
	return keys.map(key => "\t" + key + " ".repeat(max - key.length + 3) + object[key]).join("\n");
}

function log(type, message) {
	console.log(`\x1b[34m${type}\x1b[0m ${message}`);
}

function logHelp(message) {
	console.log(highlight(message));
}

function error(message) {
	console.log(`\x1b[31merror\x1b[0m ${message}`);
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

function download(res) {
	const archivePath = path.join(__dirname, "moon-template.tar.gz");
	const stream = fs.createWriteStream(archivePath);

	res.on("data", (chunk) => {
		stream.write(chunk);
	});

	res.on("end", () => {
		stream.end();

		log("download", repo);
		install(archivePath);
	});
}

function install(archivePath) {
	const targetPath = path.join(process.cwd(), name);

	exec(`mkdir ${targetPath}`, (err) => {
		if (err) throw err;

		exec(`tar -xzf ${archivePath} -C ${targetPath} --strip=1`, (err) => {
			if (err) throw err;

			log("install", targetPath);
			clean(archivePath, targetPath);
		});
	});
}

function clean(archivePath, targetPath) {
	fs.unlink(archivePath, (err) => {
		if (err) throw err;

		log("clean", archivePath);
		create(targetPath, targetPath);
		log("success", `Generated application \x1b[36m${name}\x1b[0m`);
		console.log(`To start, run:
	cd ${name}
	npm install
	npm run dev`);
	});
}

function create(currentPath, targetPath) {
	const files = fs.readdirSync(currentPath);

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const nextPath = path.join(currentPath, file);

		if (fs.statSync(nextPath).isDirectory()) {
			create(nextPath, targetPath);
		} else {
			fs.writeFileSync(nextPath, replace(fs.readFileSync(nextPath), "{# MoonName #}", name));
			log("create", path.relative(targetPath, nextPath));
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
		name = commandArguments[0];
		repo = commandOptions["-t"] || commandOptions["--template"] || "kbrsh/moon-template";

		if (name === undefined || name.length === 0) {
			error(`Invalid or unknown name.

Attempted to create an application.

Received an invalid or unknown name.

Expected a valid name. Run \x1b[35mmoon help create\x1b[0m to see usage information.`);
		}

		if (repo === true) {
			error(`Invalid or unknown template.

Attempted to create an application.

Received an invalid or unknown template.

Expected a valid template. Run \x1b[35mmoon help create\x1b[0m to see usage information.`);
		}

		const archive = {
			method: "GET",
			host: "api.github.com",
			path: `/repos/${repo}/tarball/master`,
			headers: {
				"User-Agent": "Moon"
			}
		};

		log("Moon", "Generating application");

		https.get(archive, (res) => {
			if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location !== undefined) {
				https.get(res.headers.location, (redirectRes) => {
					download(redirectRes);
				});
			} else {
				download(res);
			}
		});
		break;
	}

	default: {
		error(`Unrecognized command.

Attempted to execute a command.

Received a command that does not exist:
	${commandName}

Expected a valid command. Run \x1b[35mmoon help\x1b[0m to see valid commands.`);
		break;
	}
}
