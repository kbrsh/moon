import Moon from "moon/src/index";

test("sets storage initially", () => {
	Moon.use({ storage: Moon.storage.driver });

	const storage = {
		foo: "bar",
		moon: "titan"
	};

	Moon.run(() => ({ storage }));
	expect(JSON.parse(JSON.stringify(localStorage))).toEqual(storage);
});

test("updates storage as needed", () => {
	Moon.use({ storage: Moon.storage.driver });

	let storage = {
		foo: "bar",
		moon: "titan"
	};

	Moon.run(() => ({ storage }));
	expect(JSON.parse(JSON.stringify(localStorage))).toEqual(storage);

	storage = {
		foo: "bar",
		moon: "europa"
	};

	Moon.run(() => ({ storage }));
	expect(JSON.parse(JSON.stringify(localStorage))).toEqual(storage);
});

test("removes storage as needed", () => {
	Moon.use({ storage: Moon.storage.driver });

	let storage = {
		foo: "bar",
		moon: "titan"
	};

	Moon.run(() => ({ storage }));
	expect(JSON.parse(JSON.stringify(localStorage))).toEqual(storage);

	storage = {
		moon: "titan"
	};

	Moon.run(() => ({ storage }));
	expect(JSON.parse(JSON.stringify(localStorage))).toEqual(storage);
});
