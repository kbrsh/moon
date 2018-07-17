#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const https = require("https");
const exec = require("child_process").exec;

const name = process.argv[2];
const repo = process.argv[3] || "kbrsh/moon-template";
const archive = {
	method: "GET",
	host: "api.github.com",
	path: `/repos/${repo}/tarball/master`,
	headers: {
		"User-Agent": "Node.js"
	}
};

const MoonNameRE = /{# MoonName #}/g;

const log = (type, message) => {
	console.log(`\x1b[34m${type}\x1b[0m ${message}`);
};

const download = (res) => {
	const archivePath = path.join(__dirname, "moon-template.tar.gz");
	const stream = fs.createWriteStream(archivePath);

	res.on("data", (chunk) => {
		stream.write(chunk);
	});

	res.on("end", () => {
		stream.end();
		log("download", "template");
		install(archivePath);
	});
};

const install = (archivePath) => {
	const targetPath = path.join(process.cwd(), name);
	exec(`mkdir ${targetPath}; tar -xzf ${archivePath} -C ${targetPath} --strip=1`, (err) => {
		if (err) throw err;

		log("install", "template");

		clean(archivePath, targetPath);
	});
};

const clean = (archivePath, targetPath) => {
	fs.unlink(archivePath, (err) => {
		if (err) throw err;

		log("clean", "template");

		create(targetPath, targetPath);
		log("success", `Generated project "${name}"`)
		console.log(`To start, run:
	npm install
	npm run dev`);
	});
};

const create = (currentPath, targetPath) => {
	const files = fs.readdirSync(currentPath);
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const nextPath = path.join(currentPath, file);
		if (fs.statSync(nextPath).isDirectory()) {
			create(nextPath, targetPath);
		} else {
			fs.writeFileSync(nextPath, fs.readFileSync(nextPath).toString().replace(MoonNameRE, name));
			log("create", path.relative(targetPath, nextPath));
		}
	}
};

https.get(archive, (res) => {
	if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location !== undefined) {
		https.get(res.headers.location, (redirectRes) => {
			download(redirectRes);
		});
	} else {
		download(res);
	}
});
