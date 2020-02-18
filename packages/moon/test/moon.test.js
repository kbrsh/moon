import Moon from "moon/src/index";
const { div } = Moon.view.components;

const root = document.createElement("div");
root.id = "index-test";
document.body.appendChild(root);

test("Moon with string root", () => {
	Moon.configure({ view: {} });
	Moon.configure({
		view: { root }
	});

	Moon.view.render(<div>Test!</div>);

	expect(root.textContent).toEqual("Test!");
});

test("Moon with custom transformer", () => {
	let test = 0;

	Moon.use({
		test: {
			update: testNew => { test = testNew; },
			configure: testInit => { test = testInit; }
		}
	});

	Moon.configure({ test: 7 });
	expect(test).toEqual(7);
	Moon.test.update(49);
	expect(test).toEqual(49);
});
