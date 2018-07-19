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
console.log(exec("git add .").toString());
console.log(exec(`git commit -m "${version}"`).toString());
console.log(exec(`git tag "v${version}"`).toString());
console.log(exec("git push").toString());
console.log(exec("git push --tags").toString());
