const exec = require("child_process").execSync;
const fs = require("fs");
const path = require("path");

let tags = exec("git tag --sort=committerdate").toString().split("\n");
tags.pop();
tags = tags.slice(-2);

let commits = exec(`git log --pretty=oneline ${tags[0]}...${tags[1]}`).toString().split("\n");
commits.pop();

commits = ["330fc4be4b5cb55c29270a0f0673316f93cf0b4a perf: diff a component faster", "53412707abd5f22a872b107b3df8d575f515e5a0 feat: allow options in plugins", "2de02db7b327020f8fd05e53a0120634c3480e7b fix: handle null children when creating nodes from vnodes", "14d787697bde83be1a19a4a92ce7ba91cd086699 feat: improve parser by allowing custom elements that self close, but throw if there is no slash to indicate it", "f304213f7dc7ea597c72e4ac256002d8caadba27 breaking: make dom props faster"]

let code = "", i = 0, commit, commitEntry, hash, category, patches = [], features = [], performance = [], breaking = [];

for(; i < commits.length; i++) {
	commit = commits[i];
	commit = commit.split(" ");
	hash = commit.shift();
	commit = commit.join(" ").split(":");

	category = commit.shift();

	commit = commit.join(":");

	commitEntry = {
		hash: hash,
		message: commit
	}
	
	switch(category) {
		case "fix":
			patches.push(commitEntry);
			break;
		case "feat":
			features.push(commitEntry);
			break;
		case "perf":
			performance.push(commitEntry);
			break;
		case "breaking":
			breaking.push(commitEntry);
			break;
	}
}

let entry, first = true;

const generateCategory = (header, entries) => {
	if(entries.length > 0) {
		if(first === false) {
			code += `\n\n### ${header}\n\n`;
		} else {
			code += `### ${header}\n\n`;
			first = false;
		}

		for(i = 0; i < entries.length - 1; i++) {
			entry = entries[i];
			code += `*${entry.message} - ${entry.hash}\n`;
		}

		entry = entries[i];
		code += `*${entry.message} - ${entry.hash}`;
	}
}

generateCategory("Breaking", breaking);
generateCategory("Features", features);
generateCategory("Patches", patches);
generateCategory("Performance", performance);

const releaseNotePath = path.resolve("./RELEASE_NOTE");
fs.writeFileSync(releaseNotePath, code);
exec(`cat ./RELEASE_NOTE | pbcopy`);
fs.unlinkSync(releaseNotePath);
exec(`open https://github.com/KingPixil/moon/releases/edit/${tags[1]}`);
