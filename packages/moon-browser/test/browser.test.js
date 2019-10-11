import Moon from "moon/src/index.js";
import "moon-browser/src/index.js";

let status = 200;

window.Moon = Moon;
window.XMLHttpRequest = function() {
	this.open = () => {};
	this.send = () => {
		this.readyState = 0;
		this.onload();

		this.readyState = 1;
		this.onload();
	};

	this.DONE = 1;

	this.status = status;
	this.responseText = "const paragraphSrc = (<p>Moon Test</p>);";

	status = 500;
};
window.console.error = jest.fn();

const scriptNormal = document.createElement("script");
scriptNormal.type = "text/javascript";
scriptNormal.text = "const foo = 7;";

const scriptInline = document.createElement("script");
scriptInline.type = "text/moon";
scriptInline.text = "const paragraph = (<p>Moon Test</p>);";

const scriptSrc = document.createElement("script");
scriptSrc.type = "text/moon";
scriptSrc.src = "http://localhost/scriptSrc.js";

const scriptSrcError = document.createElement("script");
scriptSrcError.type = "text/moon";
scriptSrcError.src = "http://localhost/scriptSrc.js";

document.body.appendChild(scriptNormal);
document.body.appendChild(scriptInline);
document.body.appendChild(scriptSrc);
document.body.appendChild(scriptSrcError);

window.document.dispatchEvent(new Event("DOMContentLoaded", {}));

test("not transform normal script", () => {
	const script = document.body.childNodes[0];

	expect(script).not.toBeUndefined();
	expect(script.text).toEqual("const foo = 7;")
});

test("transform inline script", () => {
	const scriptBefore = document.body.childNodes[1];
	const scriptAfter = document.head.childNodes[0];

	expect(scriptBefore).toBeUndefined();
	expect(scriptAfter).not.toBeUndefined();
	expect(scriptAfter.text).toEqual(`var m0;const paragraph = ((function(){if(m0===undefined){m0=Moon.view.m("p",{},[Moon.view.m("text",{"":"Moon Test"},[])]);}return m0;})());`)
});

test("transform external script", () => {
	const scriptBefore = document.body.childNodes[2];
	const scriptAfter = document.head.childNodes[1];

	expect(scriptBefore).toBeUndefined();
	expect(scriptAfter).not.toBeUndefined();
	expect(scriptAfter.text).toEqual(`var m0;const paragraphSrc = ((function(){if(m0===undefined){m0=Moon.view.m("p",{},[Moon.view.m("text",{"":"Moon Test"},[])]);}return m0;})());`)
});

test("transform external script with error", () => {
	const scriptBefore = document.body.childNodes[3];
	const scriptAfter = document.head.childNodes[2];

	expect(scriptBefore).toBeUndefined();
	expect(scriptAfter).toBeUndefined();
	expect(console.error).toBeCalledWith(`[Moon] ERROR: Failed to load script with source "http://localhost/scriptSrc.js" and status 500.`);
});
