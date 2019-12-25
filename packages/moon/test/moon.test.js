import Moon from "moon/src/index";
const { div } = Moon.view.m;

const root = document.createElement("div");
root.id = "index-test";
document.body.appendChild(root);

test("Moon with string root", () => {
	Moon.use({
		view: Moon.view.driver("#index-test")
	});

	Moon.run(() => {
		return {
			view: (<div>Test!</div>)
		};
	});

	expect(root.textContent).toEqual("Test!");
});

test("Moon with invalid root type", () => {
	console.error = jest.fn();

	expect(Moon.run).toThrow();
	expect(console.error).toBeCalled();
});

test("Moon with invalid drivers type", () => {
	console.error = jest.fn();

	Moon.use((x) => x);
	expect(console.error).toBeCalled();
});

test("Moon with invalid driver - no input", () => {
	console.error = jest.fn();

	Moon.use({
		test: {}
	});
	expect(() => {
		Moon.run(() => {return { test: true };});
	}).toThrow();
	expect(console.error).toBeCalled();
});

test("Moon with invalid driver - no output", () => {
	console.error = jest.fn();

	Moon.use({
		test: { input: () => true }
	});
	expect(() => {
		Moon.run(() => {return { test: true };});
	}).toThrow();
	expect(console.error).toBeCalled();
});

test("Moon with invalid driver - no driver", () => {
	console.error = jest.fn();

	Moon.use({});
	expect(() => {
		Moon.run(() => {return { test: true };});
	}).toThrow();
	expect(console.error).toBeCalled();
});
