const fs = require("fs");
const path = require("path");
const exec = require("child_process").execSync;

const version = process.argv[2];

const packages = fs.readdirSync("./packages");
for (let i = 0; i < packages.length; i++) {
	const package = path.join("./packages", packages[i]);
	if (fs.statSync(package).isDirectory()) {
		const packageJSONPath = path.join(package, "package.json");
		const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath).toString());
		packageJSON.version = version;
		fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, 2));
	}
}

console.log(exec("npm run build").toString());

const trailingNewlinesRE = /\n+$/;
const trailingLinesRE = /\n([^\n]*)/g;

exec(`git tag v${version}`);

let tags = exec("git tag --sort=committerdate").toString().split("\n");
tags.pop();
tags = tags.slice(-2);

const commits = exec(`git log --pretty=tformat:"###COMMIT###%H###SEPARATOR###%B" ${tags[0]}...${tags[1]}`).toString().split("###COMMIT###");
commits.shift();

let log = "";

for (let i = 0; i < commits.length; i++) {
	const commit = commits[i].replace(trailingNewlinesRE, "").split("###SEPARATOR###");
	const hash = commit[0];
	const message = commit[1].replace(trailingLinesRE, "\n  $1");

	log += `* ${hash}: ${message}\n`;
}

const releaseNotePath = path.resolve("./RELEASE_NOTE");
fs.writeFileSync(releaseNotePath, log);
exec(`cat ./RELEASE_NOTE | pbcopy`);
fs.unlinkSync(releaseNotePath);
exec(`open https://github.com/kbrsh/moon/releases/edit/${tags[1]}`);
