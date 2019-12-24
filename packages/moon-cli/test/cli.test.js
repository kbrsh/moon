const fs = require("fs");
const path = require("path");
const https = require("https");
const child_process = require("child_process");

// Files
const pathTest = path.join(__dirname, "../../../test-moon-cli");
const pathTestArchive = path.join(__dirname, "../src/moon-template.tar.gz");
const pathTemplate = path.join(__dirname, "test-moon-cli-template");
const pathTemplateArchive = path.join(__dirname, "test-moon-cli-template.tar.gz");
const pathCLI = path.join(__dirname, "../src/index.js");
process.env.MOON_VERSION = "test.test.test";

child_process.execSync(`tar -czf ${pathTemplateArchive} -C ${__dirname} test-moon-cli-template`);

// Mocks
https.get = (options, fn) => {
	if (typeof options === "string" && options === "test-location") {
		fn({
			statusCode: 200,
			on: (event, fn) => {
				if (event === "data") {
					fn(fs.readFileSync(pathTemplateArchive));
				} else if (event === "end") {
					fn();
				}
			}
		});
	} else {
		fn({
			statusCode: 301,
			headers: {
				location: "test-location"
			}
		});
	}

	return {
		on: (event, fn) => {}
	};
};

child_process.exec = (cmd, fn) => {
	child_process.execSync(cmd);
	fn(null);
};

fs.unlink = (file, fn) => {
	fs.unlinkSync(file);
	fn(null);
};

fs.createWriteStream = file => {
	return {
		write: chunk => fs.writeFileSync(file, chunk),
		end: () => {}
	};
};

// Tests
function MoonCLI(args) {
	console.log = jest.fn();
	process.argv = ["node", pathCLI, ...args];

	require(pathCLI);

	return console.log.mock.calls.map(call => call[0]).join("\n") + "\n";
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

function clean(directory) {
	const files = fs.readdirSync(directory);

	for (let i = 0; i < files.length; i++) {
		const file = path.join(directory, files[i]);

		if (fs.statSync(file).isDirectory()) {
			clean(file);
		} else {
			fs.unlinkSync(file);
		}
	}

	fs.rmdirSync(directory);
}

function verify(received, expected) {
	const receivedFiles = fs.readdirSync(received);
	const expectedFiles = fs.readdirSync(expected);

	expect(receivedFiles).toEqual(expectedFiles);

	for (let i = 0; i < receivedFiles.length; i++) {
		const receivedFile = receivedFiles[i];
		const receivedFilePath = path.join(received, receivedFile);
		const expectedFile = expectedFiles[i];
		const expectedFilePath = path.join(expected, expectedFile);

		expect(receivedFile).toEqual(expectedFile);

		if (fs.statSync(receivedFilePath).isDirectory()) {
			verify(receivedFilePath, expectedFilePath);
		} else {
			expect(fs.readFileSync(receivedFilePath)).toEqual(replace(fs.readFileSync(expectedFilePath), "{# MoonName #}", "test-moon-cli"));
		}
	}
}

test("displays help by default", () => {
	jest.resetModules();
	expect(MoonCLI([])).toEqual(`Usage: moon \x1b[33m<command>\x1b[0m\x1b[36m [options]\x1b[0m

Commands:
	moon version                   output Moon CLI version
	moon help \x1b[33m<command>\x1b[0m            output help message for command
	moon create \x1b[33m<name>\x1b[0m\x1b[36m [options]\x1b[0m   create application in new directory
`);
});

test("version command", () => {
	jest.resetModules();
	expect(MoonCLI(["version"])).toEqual(`Moon CLI vtest.test.test
`);
});

test("help version command", () => {
	jest.resetModules();
	expect(MoonCLI(["help", "version"])).toEqual(`Usage: moon version
	output Moon CLI version
`);
});

test("help help command", () => {
	jest.resetModules();
	expect(MoonCLI(["help", "help"])).toEqual(`Usage: moon help \x1b[33m<command>\x1b[0m
	output help message for command

Parameters:
	\x1b[33m<command>\x1b[0m   name of Moon CLI command
`);
});

test("help create command", () => {
	jest.resetModules();
	expect(MoonCLI(["help", "create"])).toEqual(`Usage: moon create \x1b[33m<name>\x1b[0m\x1b[36m [options]\x1b[0m
	create application in new directory

Parameters:
	\x1b[33m<name>\x1b[0m   name of application and directory

Options:
\x1b[36m\t-t\x1b[0m,\x1b[36m --template\x1b[0m \x1b[33m<username>\x1b[0m/\x1b[33m<repository>\x1b[0m   GitHub repository to use as template
`);
});

test("create command", () => {
	jest.resetModules();
	expect(MoonCLI(["create", "test-moon-cli"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m kbrsh/moon-template
\x1b[34minstalled\x1b[0m ${pathTest}
\x1b[34mcleaned\x1b[0m ${pathTestArchive}
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-2.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-1/test-directory-2-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-2/test-directory-2-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-2.txt
\x1b[34mprocessed\x1b[0m test-file-1.txt
\x1b[34mprocessed\x1b[0m test-file-2.txt
\x1b[34mcreated\x1b[0m application \x1b[36mtest-moon-cli\x1b[0m

To start, run:
	cd test-moon-cli
	npm install
	npm run dev
`);
	verify(pathTest, pathTemplate);
	clean(pathTest);
	fs.unlinkSync(pathTemplateArchive);
});
