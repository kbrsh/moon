console.log = jest.fn();
process.env.MOON_VERSION = "test.test.test";

function MoonCLI(args) {
	process.argv = ["node", "packages/moon-cli/src/index.js", ...args];
	require("moon-cli/src/index.js");
}

test("displays help by default", () => {
	jest.resetModules();
	MoonCLI([]);
	expect(console.log).lastCalledWith(`Usage: moon \x1b[33m<command>\x1b[0m\x1b[36m [options]\x1b[0m

Commands:
	moon version                   output Moon CLI version
	moon help \x1b[33m<command>\x1b[0m            output help message for command
	moon create \x1b[33m<name>\x1b[0m\x1b[36m [options]\x1b[0m   create application in new directory`);
});

test("version command", () => {
	jest.resetModules();
	MoonCLI(["version"]);
	expect(console.log).lastCalledWith("Moon CLI vtest.test.test");
});

test("help version command", () => {
	jest.resetModules();
	MoonCLI(["help", "version"]);
	expect(console.log).lastCalledWith(`Usage: moon version
	output Moon CLI version`);
});

test("help help command", () => {
	jest.resetModules();
	MoonCLI(["help", "help"]);
	expect(console.log.mock.calls[console.log.mock.calls.length - 2][0] + "\n" + console.log.mock.calls[console.log.mock.calls.length - 1][0]).toEqual(`Usage: moon help \x1b[33m<command>\x1b[0m
	output help message for command

Parameters:
	\x1b[33m<command>\x1b[0m   name of Moon CLI command`);
});

test("help create command", () => {
	jest.resetModules();
	MoonCLI(["help", "create"]);
	expect(console.log.mock.calls[console.log.mock.calls.length - 3][0] + "\n" + console.log.mock.calls[console.log.mock.calls.length - 2][0] + "\n" + console.log.mock.calls[console.log.mock.calls.length - 1][0]).toEqual(`Usage: moon create \x1b[33m<name>\x1b[0m\x1b[36m [options]\x1b[0m
	create application in new directory

Parameters:
	\x1b[33m<name>\x1b[0m   name of application and directory

Options:
\x1b[36m\t-t\x1b[0m,\x1b[36m --template\x1b[0m \x1b[33m<username>\x1b[0m/\x1b[33m<repository>\x1b[0m   GitHub repository to use as template`);
});
