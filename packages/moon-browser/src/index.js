import compile from "moon-compiler/src/compile";
import { error } from "util/index";

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
			scriptNew.type = "text/javascript";
			scriptNew.text = compile(script.text);

			script.parentNode.replaceChild(scriptNew, script);
			load();
		} else {
			const xhr = new XMLHttpRequest();
			xhr.responseType = "text";

			xhr.onload = () => {
				if (xhr.status === 0 || xhr.status === 200) {
					const scriptNew = document.createElement("script");
					scriptNew.type = "text/javascript";
					scriptNew.text = compile(xhr.response);

					script.parentNode.replaceChild(scriptNew, script);
				} else {
					error(`Invalid script HTTP response.

Attempted to download script:
	${src}

Received error HTTP status code:
	${xhr.status}

Expected OK HTTP status code 0 or 200.`);
				}

				load();
			};

			xhr.onerror = () => {
				error(`Failed script HTTP request.

Attempted to download script:
	${src}

Received error.

Expected successful HTTP request.`);
				load();
			};

			xhr.open("GET", src, true);
			xhr.send(null);
		}
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const scriptsAll = document.querySelectorAll("script");

	for (let i = 0; i < scriptsAll.length; i++) {
		const script = scriptsAll[i];

		if (script.type === "text/moon") {
			scripts.push(script);
		}
	}

	load();
});
