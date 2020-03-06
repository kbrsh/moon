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
