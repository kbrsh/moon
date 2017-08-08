"use strict";

const browserify = require("browserify");
const crypto = require("crypto");
const minifyHTML = require("html-minifier").minify;

const fs = require("fs");
const path = require("path");

const util = require("./util.js");
const bundler = browserify("./js/scripts.js");

const cwd = process.cwd();

let jsHash = "min";
let cssHash = "min";

// Empty `dist` Directory
util.empty(path.join(cwd, "dist"))

// Build JS
const tmpJSPath = path.join(cwd, "dist", "js", `build.min.js`);
bundler
  .transform("moonify")
  .transform("bubleify", {
    extensions: [".js", ".moon"]
  })
  .transform("uglifyify")
  .plugin("moonify/plugins/extract-css.js")
  .bundle()
  .pipe(fs.createWriteStream(tmpJSPath));

// Build CSS
bundler.on("bundle", function(bs) {
  bs.on("end", function() {
    jsHash = crypto.createHash("md5").update(fs.readFileSync(tmpJSPath).toString()).digest("hex").slice(-10);
    fs.renameSync(tmpJSPath, path.join(cwd, "dist", "js", `build.${jsHash}.js`));
    cssHash = require("./bundle-css.js");
    buildHTML();
  });
});

// Build HTML
const buildHTML = function() {
  let minifiedHTML = minifyHTML(fs.readFileSync(path.join(cwd, "index.html")).toString(), {
    caseSensitive: true,
    keepClosingSlash: true,
    removeAttributeQuotes: false,
    collapseWhitespace: true
  });

  minifiedHTML = minifiedHTML.replace(/<link\s+([^>]*?\s+)?href="(\.?\/dist\/([^".]*)\.([^".]*)\.([^".]*))"/gi, `<link $1href="./$3.${cssHash}.$5"`).replace(/<script\s+([^>]*?\s+)?src="(\.?\/dist\/([^".]*)\.([^".]*)\.([^".]*))"/gi, `<script $1src="./$3.${jsHash}.$5"`);

  fs.writeFileSync(path.join(cwd, "dist", "index.html"), minifiedHTML);
}
