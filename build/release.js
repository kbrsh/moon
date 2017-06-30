const exec = require("child_process").execSync;

let tags = exec("git tag --sort=committerdate").toString().split("\n");
tags.pop();
tags = tags.slice(-2);

let commits = exec(`git log --pretty=oneline ${tags[0]}...${tags[1]}`).toString().split("\n");
commits.pop();

commits = ["330fc4be4b5cb55c29270a0f0673316f93cf0b4a perf: diff a component faster", "53412707abd5f22a872b107b3df8d575f515e5a0 feat: allow options in plugins", "2de02db7b327020f8fd05e53a0120634c3480e7b fix: handle null children when creating nodes from vnodes"]

let code = "", i = 0, commit, commitEntry, hash, category, patches = [], features = [], performance = [], breaking = [];

for(; i < commits.length; i++) {
	commit = commits[i];
	commit = commit.split(" ");
	hash = commit.shift();
	commit = commit.join(" ");

	category = commit.split(":").shift();

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
		code += `${first === false ? "\n\n" : ""}# ${header}\n\n`;
		for(i = 0; i < entries.length; i++) {
			entry = entries[i];
			code += `* ${entry.hash} ${entry.message}`;
		}
		first = false;
	}
}

generateCategory("Breaking", breaking);
generateCategory("Features", features);
generateCategory("Patches", patches);
generateCategory("Performance", performance);

console.log(code);