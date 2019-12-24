const fs = require("fs");
const path = require("path");
const exec = require("child_process").execSync;

const version = JSON.parse(fs.readFileSync(path.join(__dirname, "../../package.json"), "utf8")).version;
const packagesPath = path.join(__dirname, "../../packages");
const packages = fs.readdirSync(packagesPath);

for (let i = 0; i < packages.length; i++) {
	const package = packages[i];

	if (package.slice(0, 4) === "moon") {
		const packageJSONPath = path.join(packagesPath, package, "package.json");
		const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath, "utf8"));
		packageJSON.version = version;

		fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, "\t"));
	}
}

console.log(exec("npm run build").toString());
console.log(exec("npm run test").toString());
console.log(exec("git add .").toString());
console.log(exec(`git commit -m "v${version}"`).toString());
console.log(exec(`git tag "v${version}"`).toString());
console.log(exec("git push").toString());
console.log(exec("git push --tags").toString());
