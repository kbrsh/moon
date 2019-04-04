import Moon from "../src/index";

/*test("root Moon instance", () => {
	const instance = new Moon({ root: "test", view: "" });
	expect(instance.constructor.name).toBe("Function");
	expect(instance.name).toBe("Root");
});*/

test("root Moon constructor", () => {
	const Root = new Moon({ view: "" });
	expect(Root.constructor.name).toBe("Function");
	expect(new Root().name).toBe("Root");
});
