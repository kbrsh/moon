import Moon from "moon/src/index.js";
import "moon-browser/src/index.js";

let status = 200;
let error = false;

window.Moon = Moon;
window.XMLHttpRequest = function() {
	this.open = () => {};
	this.send = error ? () => { this.onerror(); } : () => { this.onload(); };
	this.status = status;
	this.response = "const paragraphSrc = (<Moon.view.m.p>Moon Test</Moon.view.m.p>);";

	if (status === 200) {
		status = 500;
	} else {
		error = true;
	}
};
window.console.error = jest.fn();

const scriptNormal = document.createElement("script");
scriptNormal.type = "text/javascript";
scriptNormal.text = "const foo = 7;";

const scriptInline = document.createElement("script");
scriptInline.type = "text/moon";
scriptInline.text = "const paragraph = (<Moon.view.m.p>Moon Test</Moon.view.m.p>);";

const scriptSrc = document.createElement("script");
scriptSrc.type = "text/moon";
scriptSrc.src = "http://localhost/scriptSrc.js";

const scriptSrcErrorResponse = document.createElement("script");
scriptSrcErrorResponse.type = "text/moon";
scriptSrcErrorResponse.src = "http://localhost/scriptSrc.js";

const scriptSrcErrorRequest = document.createElement("script");
scriptSrcErrorRequest.type = "text/moon";
scriptSrcErrorRequest.src = "http://localhost/scriptSrc.js";

document.body.appendChild(scriptNormal);
document.body.appendChild(scriptInline);
document.body.appendChild(scriptSrc);
document.body.appendChild(scriptSrcErrorResponse);
document.body.appendChild(scriptSrcErrorRequest);

window.document.dispatchEvent(new Event("DOMContentLoaded", {}));

test("not transform normal script", () => {
	const script = document.body.childNodes[0];

	expect(script).not.toBeUndefined();
	expect(script.text).toEqual("const foo = 7;")
});

test("transform inline script", () => {
	const script = document.body.childNodes[1];

	expect(script).not.toBeUndefined();
	expect(script.type).toEqual("text/javascript");
	expect(script.text).toEqual(`const paragraph = (Moon.view.m.p({children:[Moon.view.m.text({data:\"Moon Test\"})]}));`);
});

test("transform external script", () => {
	const script = document.body.childNodes[2];

	expect(script).not.toBeUndefined();
	expect(script.type).toEqual("text/javascript");
	expect(script.text).toEqual(`const paragraphSrc = (Moon.view.m.p({children:[Moon.view.m.text({data:\"Moon Test\"})]}));`);
});

test("transform external script with error response", () => {
	const script = document.body.childNodes[3];

	expect(script).not.toBeUndefined();
	expect(script.type).toEqual("text/moon");
	expect(console.error).toBeCalledWith(`[Moon] ERROR: Invalid script HTTP response.

Attempted to download script:
	http://localhost/scriptSrc.js

Received error HTTP status code:
	500

Expected OK HTTP status code 0 or 200.`);
});

test("transform external script with error request", () => {
	const script = document.body.childNodes[4];

	expect(script).not.toBeUndefined();
	expect(script.type).toEqual("text/moon");
	expect(console.error).toBeCalledWith(`[Moon] ERROR: Failed script HTTP request.

Attempted to download script:
	http://localhost/scriptSrc.js

Received error.

Expected successful HTTP request.`);
});
