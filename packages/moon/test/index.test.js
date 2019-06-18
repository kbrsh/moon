import Moon from "../src/index";

window.requestAnimationFrame = (fn) => fn();

test("Moon component function", () => {
	Moon({ name: "Test", view: "test" });
	expect(typeof Moon.components.Test).toBe("function");
});

test("Moon component function with default data", () => {
	Moon({ name: "Test", view: "test", data: { foo: "bar" } });
	expect(typeof Moon.components.Test).toBe("function");
});

test("Moon without view error", () => {
	console.error = jest.fn();

	Moon({ name: "Test" });
	expect(console.error).toBeCalled();
});

test("Moon Root component without root error", () => {
	console.error = jest.fn();

	expect(() => {
		Moon({});
	}).toThrow();
	expect(console.error).toBeCalled();
});

test("Moon with string root", () => {
	const root = document.createElement("div");

	root.id = "test-index-string-root";

	document.body.appendChild(root);

	Moon({
		root: "#test-index-string-root",
		view: `<div id="test-index-string-root">Hello Moon!</div>`
	});
	expect(root.textContent).toEqual("Hello Moon!");
	document.body.removeChild(root);
});

test("Moon component with default data", () => {
	const root = document.createElement("div");

	root.id = "test-index-default-data";

	document.body.appendChild(root);

	Moon({
		name: "Test",
		view: `{foo + " " + bar}`,
		data: {
			foo: "bar",
			bar: "baz"
		}
	});

	Moon({
		root: "#test-index-default-data",
		view: `<div id="test-index-default-data"><Test foo="Moon"/></div>`
	});

	expect(root.textContent).toEqual("Moon baz");
	document.body.removeChild(root);
});
