import compiler from "moon-compiler/src/index";

console.error = jest.fn(() => {});

test("report parse errors", () => {
	expect(() => compiler.compile(`<div test="/>`).constructor.name).toThrow();
	expect(console.error).toBeCalledWith(`[Moon] ERROR: Invalid input to parser.\n\nAttempted to parse input.\n\nExpected \"\"\".\n\nReceived:\n\n1| <div test=\"/> \n |              ^`);
});
