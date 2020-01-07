localStorage.bar = "baz";
jest.resetModules();

const Moon = require("moon/src/index").default;

test("sets storage initially", () => {
	Moon.use({ storage: Moon.storage.driver });

	const storage = {
		foo: "bar",
		moon: "titan"
	};

	Moon.run(() => ({ storage }));
	expect(JSON.parse(JSON.stringify(localStorage))).toEqual(storage);
	Moon.run(input => { expect(input.storage).toEqual(storage) });
});

test("updates storage as needed", () => {
	Moon.use({ storage: Moon.storage.driver });

	let storage = {
		foo: "bar",
		moon: "titan"
	};

	Moon.run(() => ({ storage }));
	expect(JSON.parse(JSON.stringify(localStorage))).toEqual(storage);
	Moon.run(input => { expect(input.storage).toEqual(storage) });

	storage = {
		foo: "bar",
		moon: "europa"
	};

	Moon.run(() => ({ storage }));
	expect(JSON.parse(JSON.stringify(localStorage))).toEqual(storage);
	Moon.run(input => { expect(input.storage).toEqual(storage) });
});

test("removes storage as needed", () => {
	Moon.use({ storage: Moon.storage.driver });

	let storage = {
		foo: "bar",
		moon: "titan"
	};

	Moon.run(() => ({ storage }));
	expect(JSON.parse(JSON.stringify(localStorage))).toEqual(storage);
	Moon.run(input => { expect(input.storage).toEqual(storage) });

	storage = {
		moon: "titan"
	};

	Moon.run(() => ({ storage }));
	expect(JSON.parse(JSON.stringify(localStorage))).toEqual(storage);
	Moon.run(input => { expect(input.storage).toEqual(storage) });
});
