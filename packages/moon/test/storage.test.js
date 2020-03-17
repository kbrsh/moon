localStorage.bar = "baz";
jest.resetModules();

const m = require("moon/src/index").default.m;

test("sets storage initially", () => {
	m.storage.foo = "bar";
	m.storage.moon = "titan";
	expect(localStorage).toEqual(m.storage);
});

test("updates storage as needed", () => {
	m.storage.foo = "bar";
	m.storage.moon = "titan";
	expect(localStorage).toEqual(m.storage);

	m.storage.foo = "bar";
	m.storage.moon = "europa";
	expect(localStorage).toEqual(m.storage);
});

test("removes storage as needed", () => {
	delete m.storage.foo;
	expect(localStorage).toEqual(m.storage);
});

test("sets whole storage", () => {
	m.storage = {};
	expect(localStorage).toEqual(m.storage);

	m.storage = {
		foo: "bar",
		moon: "titan"
	};
	expect(localStorage).toEqual(m.storage);
});

test("updates whole storage", () => {
	m.storage = {
		moon: "titan",
		bar: "baz"
	};
	expect(localStorage).toEqual(m.storage);
});

test("deletes whole storage", () => {
	m.storage = {};
	expect(localStorage).toEqual(m.storage);
});
