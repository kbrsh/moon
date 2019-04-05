import { lex, tokenString } from "../../src/compiler/lexer/lexer";

test("lex opening tag", () => {
	expect(lex(`<div>`)).toEqual([{"attributes": {}, "closed": false, "type": "tagOpen", "value": "div"}]);
});

test("lex closing tag", () => {
	expect(lex(`</div>`)).toEqual([{"type": "tagClose", "value": "div"}]);
});

test("lex self closing tag", () => {
	expect(lex(`<input/>`)).toEqual([{"attributes": {}, "closed": true, "type": "tagOpen", "value": "input"}]);
});

test("lex text", () => {
	expect(lex(`text test`)).toEqual([{"attributes": {"": "\"text test\""}, "closed": true, "type": "tagOpen", "value": "Text"}]);
});

test("lex text inside tag", () => {
	expect(lex(`<div>text</div>`)).toEqual([
		{
			"type": "tagOpen",
			"value": "div",
			"attributes": {},
			"closed": false
		},
		{
			"type": "tagOpen",
			"value": "Text",
			"attributes": {
				"": "\"text\""
			},
			"closed": true
		},
		{
			"type": "tagClose",
			"value": "div"
		}
	]);
})

test("lex expression", () => {
	expect(lex(`{data + 1}`)).toEqual([{"attributes": {"": "data + 1"}, "closed": true, "type": "tagOpen", "value": "Text"}]);
});

test("lex attributes", () => {
	expect(lex(`<div id="test-id" class='test-class' dynamic={true}>`)).toEqual([{"attributes": {"id": "\"test-id\"", "class": "'test-class'", dynamic: "true"}, "closed": false, "type": "tagOpen", "value": "div"}]);
});

test("lex comments", () => {
	expect(lex(`<!-- comment -->`)).toEqual([]);
});

test("opening tag token to string", () => {
	const input = "<div>";
	expect(tokenString(lex(input)[0])).toBe(input);
});

test("opening tag token with attributes to string", () => {
	const input = `<div id="test-id" class='test-class' expression={dynamic}>`;
	expect(tokenString(lex(input)[0])).toBe(input);
});

test("self-closing tag token to string", () => {
	const input = `<input/>`;
	expect(tokenString(lex(input)[0])).toBe(input);
});

test("self-closing tag token with attributes to string", () => {
	const input = `<input id="test-id" class='test-class' expression={dynamic}/>`;
	expect(tokenString(lex(input)[0])).toBe(input);
});

test("closing tag token to string", () => {
	const input = `</div>`;
	expect(tokenString(lex(input)[0])).toBe(input);
});

test("text token to string", () => {
	const input = `Test Text`;
	expect(tokenString(lex(input)[0])).toBe(input);
});

test("expression token to string", () => {
	const input = `{dynamic + 1}`;
	expect(tokenString(lex(input)[0])).toBe(input);
});

test("lexer errors", () => {
	process.env.MOON_ENV = "development";
	console.error = jest.fn();

	lex("<div><");
	expect(console.error).toBeCalled();

	lex("</input");
	expect(console.error.mock.calls.length).toBe(2);

	lex("<!-- never ending comment");
	expect(console.error.mock.calls.length).toBe(3);

	process.env.MOON_ENV = "production";
	console.error = jest.fn();

	expect(() => { lex("<div><"); }).toThrow();
	expect(console.error).not.toBeCalled();

	expect(() => { lex("</input"); }).toThrow();
	expect(console.error).not.toBeCalled();

	expect(() => { lex("<!-- never ending comment"); }).toThrow();
	expect(console.error).not.toBeCalled();
});
