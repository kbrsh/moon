import Moon from "../src/index";

test("Moon component function", () => {
	Moon({ name: "Test", view: "test" });
	expect(typeof Moon.components.Test).toBe("function");
});
