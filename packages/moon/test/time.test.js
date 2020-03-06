import Moon from "moon/src/index";

test("time as input", () => {
	window.Date.now = jest.fn(() => 7);

	expect(Moon.time.tell()).toEqual(7);
	expect(Date.now).toBeCalled();
});
