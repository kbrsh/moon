const fs = require("fs");
const path = require("path");
const exec = require("child_process").execSync;

const version = JSON.parse(fs.readFileSync("./package.json", "utf8")).version;
const packages = fs.readdirSync("./packages");

for (let i = 0; i < packages.length; i++) {
	const package = path.join("./packages", packages[i]);
	if (fs.statSync(package).isDirectory()) {
		const packageJSONPath = path.join(package, "package.json");
		const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath, "utf8"));
		packageJSON.version = version;
		fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, "\t"));
	}
}

console.log(exec("npm run build").toString());
console.log(exec("git add .").toString());
console.log(exec(`git commit -m "v${version}"`).toString());
console.log(exec(`git tag "v${version}"`).toString());
console.log(exec("git push").toString());
console.log(exec("git push --tags").toString());
