import Moon from "../src/index";

test("Moon component function", () => {
	Moon({ name: "Test", view: "test" });
	expect(typeof Moon.components.Test).toBe("function");
});

test("Moon component function with default data", () => {
	Moon({ name: "Test", view: "test", data: { foo: "bar" } });
	expect(typeof Moon.components.Test).toBe("function");
});
