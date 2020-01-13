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

// Mocks
let httpsRequest;
let httpsArchiveLinkStatusCode = 302;
let httpsArchiveLinkError;
let httpsDownloadStatusCode = 200;
let httpsDownloadError;
let child_processMkdirError;
let child_processTarError;
let fsUnlinkError;

https.get = (options, fn) => {
	if (typeof options === "string" && options === "test-location") {
		fn({
			statusCode: httpsDownloadStatusCode,
			on: (event, fn) => {
				if (event === "data") {
					fn(fs.readFileSync(pathTemplateArchive));
				} else if (event === "end") {
					fn();
				}
			}
		});

		return {
			on: (event, fn) => {
				if (httpsDownloadError !== undefined && event === "error") {
					fn(httpsDownloadError);
				}
			}
		};
	} else {
		expect(options).toEqual(httpsRequest);

		fn({
			statusCode: httpsArchiveLinkStatusCode,
			headers: {
				location: "test-location"
			}
		});

		return {
			on: (event, fn) => {
				if (httpsArchiveLinkError !== undefined && event === "error") {
					fn(httpsArchiveLinkError);
				}
			}
		};
	}
};

child_process.exec = (cmd, fn) => {
	child_process.execSync(cmd);

	if (child_processMkdirError !== undefined && cmd.slice(0, 5) === "mkdir") {
		fn(child_processMkdirError);
	} else if (child_processTarError !== undefined && cmd.slice(0, 3) === "tar") {
		fn(child_processTarError);
	} else {
		fn(null);
	}
};

fs.unlink = (file, fn) => {
	fs.unlinkSync(file);

	if (fsUnlinkError === undefined) {
		fn(null);
	} else {
		fn(fsUnlinkError);
	}
};

fs.createWriteStream = file => {
	return {
		write: chunk => fs.writeFileSync(file, chunk),
		end: () => {}
	};
};

// Tests
function MoonCLI(args, error) {
	console.log = jest.fn();
	process.argv = ["node", pathCLI, ...args];

	if (error === undefined) {
		require(pathCLI);
	} else {
		expect(() => {
			require(pathCLI)
		}).toThrow(error);
	}

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

function init() {
	child_process.execSync(`tar -czf ${pathTemplateArchive} -C ${__dirname} test-moon-cli-template`);
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

function cleanAll() {
	httpsRequest = undefined;
	httpsArchiveLinkStatusCode = 302;
	httpsArchiveLinkError = undefined;
	httpsDownloadStatusCode = 200;
	httpsDownloadError = undefined;
	child_processMkdirError = undefined;
	child_processTarError = undefined;
	fsUnlinkError = undefined;

	fs.unlinkSync(pathTemplateArchive);

	if (fs.existsSync(pathTest)) {
		clean(pathTest);
	}

	if (fs.existsSync(pathTestArchive)) {
		fs.unlinkSync(pathTestArchive);
	}
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
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/kbrsh/moon-template/tarball/master",
		headers: {
			"User-Agent": "Moon"
		}
	};

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
	cleanAll();
});

test("create command with custom template -t", () => {
	init();
	jest.resetModules();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/test-moon-cli/test-moon-cli-template/tarball/master",
		headers: {
			"User-Agent": "Moon"
		}
	};

	expect(MoonCLI(["create", "test-moon-cli", "-t", "test-moon-cli/test-moon-cli-template"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m test-moon-cli/test-moon-cli-template
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
	cleanAll();
});

test("create command with custom template --template", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/test-moon-cli/test-moon-cli-template/tarball/master",
		headers: {
			"User-Agent": "Moon"
		}
	};

	expect(MoonCLI(["create", "test-moon-cli", "--template", "test-moon-cli/test-moon-cli-template"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m test-moon-cli/test-moon-cli-template
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
	cleanAll();
});

test("error on unknown command", () => {
	jest.resetModules();
	expect(MoonCLI(["unknown"])).toEqual(`\x1b[31merror\x1b[0m Unrecognized command.

Attempted to execute a command.

Received a command that does not exist:
	unknown

Expected a valid command. Run \x1b[35mmoon help\x1b[0m to see valid commands.
`);
});

test("error on invalid create name", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/kbrsh/moon-template/tarball/master",
		headers: {
			"User-Agent": "Moon"
		}
	};

	expect(MoonCLI(["create"], `The "path" argument must be of type string. Received undefined`)).toEqual(`\x1b[31merror\x1b[0m Invalid or unknown name.

Attempted to create an application.

Received an invalid or unknown name.

Expected a valid name. Run \x1b[35mmoon help create\x1b[0m to see usage information.
\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m kbrsh/moon-template
`);
	cleanAll(pathTest);
});

test("error on invalid create template", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/true/tarball/master",
		headers: {
			"User-Agent": "Moon"
		}
	};

	expect(MoonCLI(["create", "test-moon-cli", "-t"])).toEqual(`\x1b[31merror\x1b[0m Invalid or unknown template.

Attempted to create an application.

Received an invalid or unknown template.

Expected a valid template. Run \x1b[35mmoon help create\x1b[0m to see usage information.
\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m true
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
	cleanAll(pathTest);
});

test("error on error HTTP status code archive link", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/kbrsh/moon-template/tarball/master",
		headers: {
			"User-Agent": "Moon"
		}
	};
	httpsArchiveLinkStatusCode = 500;

	expect(MoonCLI(["create", "test-moon-cli"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[31merror\x1b[0m Invalid archive link HTTP response.

Attempted to fetch archive link for template:
	https://api.github.com/repos/kbrsh/moon-template/tarball/master

Received error HTTP status code:
	500

Expected found HTTP status code 302.
`);
	cleanAll(pathTest);
});

test("error on error HTTP status code download", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/kbrsh/moon-template/tarball/master",
		headers: {
			"User-Agent": "Moon"
		}
	};
	httpsDownloadStatusCode = 500;

	expect(MoonCLI(["create", "test-moon-cli"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[31merror\x1b[0m Invalid download HTTP response.

Attempted to download template:
	test-location

Received error HTTP status code:
	500

Expected OK HTTP status code 200.
`);
	cleanAll(pathTest);
});

test("error on HTTP error for archive link", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/kbrsh/moon-template/tarball/master",
		headers: {
			"User-Agent": "Moon"
		}
	};
	httpsArchiveLinkError = "error archive link";

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
\x1b[31merror\x1b[0m Failed archive link HTTP request.

Attempted to fetch archive link for template:
	https://api.github.com/repos/kbrsh/moon-template/tarball/master

Received error:
	error archive link

Expected successful HTTP request.
`);
	cleanAll(pathTest);
});

test("error on HTTP error for download", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/kbrsh/moon-template/tarball/master",
		headers: {
			"User-Agent": "Moon"
		}
	};
	httpsDownloadError = "error download";

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
\x1b[31merror\x1b[0m Failed download HTTP request.

Attempted to download template:
	test-location

Received error:
	error download

Expected successful HTTP request.
`);
	cleanAll(pathTest);
});

test("error making directory", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/kbrsh/moon-template/tarball/master",
		headers: {
			"User-Agent": "Moon"
		}
	};
	child_processMkdirError = "error making directory";

	expect(MoonCLI(["create", "test-moon-cli"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m kbrsh/moon-template
\x1b[31merror\x1b[0m Failed directory creation.

Attempted to create directory:
	${pathTest}

Received error:
	error making directory

Expected successful directory creation.
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
	cleanAll(pathTest);
});

test("error extracting", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/kbrsh/moon-template/tarball/master",
		headers: {
			"User-Agent": "Moon"
		}
	};
	child_processTarError = "error extracting";

	expect(MoonCLI(["create", "test-moon-cli"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m kbrsh/moon-template
\x1b[31merror\x1b[0m Failed archive extraction.

Attempted to extract archive to target:
	${pathTestArchive} -> ${pathTest}

Received error:
	error extracting

Expected successful archive extraction.
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
	cleanAll(pathTest);
});

test("error cleaning", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/kbrsh/moon-template/tarball/master",
		headers: {
			"User-Agent": "Moon"
		}
	};
	fsUnlinkError = "error cleaning";

	expect(MoonCLI(["create", "test-moon-cli"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m kbrsh/moon-template
\x1b[34minstalled\x1b[0m ${pathTest}
\x1b[31merror\x1b[0m Failed archive deletion.

Attempted to delete archive:
	${pathTestArchive}

Received error:
	error cleaning

Expected successful archive deletion.
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
	cleanAll(pathTest);
});
