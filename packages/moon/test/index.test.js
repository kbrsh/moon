import Moon from "moon/src/index.js";

test("Moon with invalid root type", () => {
	console.error = jest.fn();

	expect(Moon).toThrow();
	expect(console.error).toBeCalled();
});

test("Moon with invalid drivers type", () => {
	console.error = jest.fn();

	Moon((x) => x);
	expect(console.error).toBeCalled();
});
