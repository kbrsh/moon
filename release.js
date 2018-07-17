const exec = require("child_process").execSync;
const fs = require("fs");
const path = require("path");

let tags = exec("git tag --sort=committerdate").toString().split("\n");
tags.pop();
tags = tags.slice(-2);

let commits = exec(`git log --pretty=format:"%H%n%B%n%n%n~~~COMMIT~~~%n%n%n" ${tags[0]}...${tags[1]}`).toString().split("\n\n\n~~~COMMIT~~~\n\n\n");
commits.pop();

let log = "";
let i = 0;
let commit;
let commitEntry;
let hash;
let category;
let breaking = [];
let features = [];
let patches = [];
let performance = [];
let refactor = [];
let docs = [];

for(; i < commits.length; i++) {
	commit = commits[i].split("\n");
	commit.shift();
	commit.pop();
	hash = commit.shift();
	commit = commit.join("\n").split(":");
	category = commit.shift();
	commit = commit.join(":").split("\n");

	let body;
	if(commit.length > 1) {
		let commitSubject = commit.shift();
		body = commit.map((item) => `    ${item}`).join("\n");
		if(body.trim().length === 0) {
			body = undefined;
		}
		commit = commitSubject;
	}

	commitEntry = {
		hash: hash,
		subject: commit,
		body: body
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
		case "docs":
			docs.push(commitEntry);
			break;
		case "refactor":
			refactor.push(commitEntry);
			break;
		case "breaking":
			breaking.push(commitEntry);
			break;
	}
}

let entry;
let first = true;

const generateCategory = (header, entries) => {
	if(entries.length > 0) {
		if(first === true) {
			log += `## ${header}\n\n`;
			first = false;
		} else {
			log += `\n\n## ${header}\n\n`;
		}

		for(i = 0; i < entries.length - 1; i++) {
			entry = entries[i];
			log += `* ${entry.hash}${entry.subject}\n`;

			if(entry.body !== undefined) {
				log += `${entry.body}\n`;
			}
		}

		entry = entries[i];
		log += `* ${entry.hash}${entry.subject}`;
		if(entry.body !== undefined) {
			log += `\n${entry.body}`;
		}
	}
}

generateCategory("Breaking Changes", breaking);
generateCategory("Features", features);
generateCategory("Patches", patches);
generateCategory("Performance", performance);
generateCategory("Refactoring", refactor);
generateCategory("Documentation", docs);

const releaseNotePath = path.resolve("./RELEASE_NOTE");
fs.writeFileSync(releaseNotePath, log);
exec(`cat ./RELEASE_NOTE | pbcopy`);
fs.unlinkSync(releaseNotePath);
exec(`open https://github.com/kbrsh/moon/releases/edit/${tags[1]}`);
