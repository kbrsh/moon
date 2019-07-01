import compile from "moon-compiler/src/index.js";
import { error } from "util/util";

/**
 * Async script sources
 */
const scriptsAsync = [];

/**
 * Head element
 */
let head;

/**
 * Script elements
 */
let scripts;

/**
 * Load async scripts in the order they appear.
 */
function load() {
	if (scriptsAsync.length !== 0) {
		const xhr = new XMLHttpRequest();
		const src = scriptsAsync.shift();

		xhr.addEventListener("load", function() {
			if (xhr.readyState === xhr.DONE) {
				if (xhr.status === 0 || xhr.status === 200) {
					const scriptNew = document.createElement("script");
					scriptNew.text = compile(this.responseText);
					head.appendChild(scriptNew);
				} else {
					error(`Failed to load script with source "${src}" and status ${xhr.status}.`);
				}

				load();
			}
		});
		xhr.open("GET", src, true);
		xhr.send();
	}
}

document.addEventListener("DOMContentLoaded", () => {
	head = document.querySelector("head");
	scripts = document.querySelectorAll("script");

	for (let i = 0; i < scripts.length; i++) {
		const script = scripts[i];

		if (script.type === "text/moon") {
			const src = script.src;

			if (src.length === 0) {
				const scriptNew = document.createElement("script");
				scriptNew.text = compile(script.text);
				head.appendChild(scriptNew);
			} else {
				scriptsAsync.push(src);
			}

			script.parentNode.removeChild(script);
		}
	}

	load();
});
