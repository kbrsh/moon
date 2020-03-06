localStorage.bar = "baz";
jest.resetModules();

const Moon = require("moon/src/index").default;

test("sets storage initially", () => {
	Moon.storage.foo = "bar";
	Moon.storage.moon = "titan";
	expect(localStorage).toEqual(Moon.storage);
});

test("updates storage as needed", () => {
	Moon.storage.foo = "bar";
	Moon.storage.moon = "titan";
	expect(localStorage).toEqual(Moon.storage);

	Moon.storage.foo = "bar";
	Moon.storage.moon = "europa";
	expect(localStorage).toEqual(Moon.storage);
});

test("removes storage as needed", () => {
	delete Moon.storage.foo;
	expect(localStorage).toEqual(Moon.storage);
});
