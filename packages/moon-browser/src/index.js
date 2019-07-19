import compiler from "moon-compiler/src/index";
import { error } from "util/util";

/**
 * Head element
 */
let head;

/**
 * Script elements
 */
const scripts = [];

/**
 * Load scripts in the order they appear.
 */
function load() {
	if (scripts.length !== 0) {
		const script = scripts.shift();
		const src = script.src;

		if (src.length === 0) {
			const scriptNew = document.createElement("script");
			scriptNew.text = compiler.compile(script.text);
			head.appendChild(scriptNew);
			script.parentNode.removeChild(script);
			load();
		} else {
			const xhr = new XMLHttpRequest();

			xhr.addEventListener("load", function() {
				if (xhr.readyState === xhr.DONE) {
					if (xhr.status === 0 || xhr.status === 200) {
						const scriptNew = document.createElement("script");
						scriptNew.text = compiler.compile(this.responseText);
						head.appendChild(scriptNew);
					} else {
						error(`Failed to load script with source "${src}" and status ${xhr.status}.`);
					}

					script.parentNode.removeChild(script);
					load();
				}
			});
			xhr.open("GET", src, true);
			xhr.send();
		}
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const scriptElements = document.querySelectorAll("script");
	head = document.querySelector("head");

	for (let i = 0; i < scriptElements.length; i++) {
		const scriptElement = scriptElements[i];

		if (scriptElement.type === "text/moon") {
			scripts.push(scriptElement);
		}
	}

	load();
});
