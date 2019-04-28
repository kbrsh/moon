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
	expect(lex(`text test`)).toEqual([{"attributes": {"": "\"text test\""}, "closed": true, "type": "tagOpen", "value": "text"}]);
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
			"value": "text",
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
	expect(lex(`{data + 1}`)).toEqual([{"attributes": {"": "data.data + 1"}, "closed": true, "type": "tagOpen", "value": "text"}]);
});

test("lex attributes", () => {
	expect(lex(`<div id="test-id" class='test-class' dynamic={true} self>`)).toEqual([{"attributes": {"id": "\"test-id\"", "class": "'test-class'", dynamic: "true", self: "\"\""}, "closed": false, "type": "tagOpen", "value": "div"}]);
});

test("lex events", () => {
	expect(lex(`<div id="test-id" class='test-class' dynamic={true} self @event={doSomething()}>`)).toEqual([{"attributes": {"id": "\"test-id\"", "class": "'test-class'", dynamic: "true", "@event": "function($event){data.doSomething()}", self: "\"\""}, "closed": false, "type": "tagOpen", "value": "div"}]);
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
	expect(tokenString(lex(input)[0])).toBe(input.replace("dynamic", "data.dynamic"));
});

test("self-closing tag token to string", () => {
	const input = `<input/>`;
	expect(tokenString(lex(input)[0])).toBe(input);
});

test("self-closing tag token with attributes to string", () => {
	const input = `<input id="test-id" class='test-class' expression={dynamic}/>`;
	expect(tokenString(lex(input)[0])).toBe(input.replace("dynamic", "data.dynamic"));
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
	expect(tokenString(lex(input)[0])).toBe(input.replace("dynamic", "data.dynamic"));
});

test("lex error from unclosed opening bracket", () => {
	console.error = jest.fn();

	expect(Array.isArray(lex("<div><"))).toBe(true);
	expect(console.error).toBeCalled();
});

test("lex error from invalid opening tag", () => {
	console.error = jest.fn();

	expect(() => {lex("<div");}).toThrow();
	expect(console.error).toBeCalled();
});

test("lex error from invalid self-closing tag", () => {
	console.error = jest.fn();

	expect(() => {lex("<input/");}).toThrow();
	expect(console.error).toBeCalled();
});

test("lex error from unclosed closing tag", () => {
	console.error = jest.fn();

	expect(Array.isArray(lex("</div"))).toBe(true);
	expect(console.error).toBeCalled();
});

test("lex error from unclosed comment", () => {
	console.error = jest.fn();

	expect(Array.isArray(lex("<!-- endless comment"))).toBe(true);
	expect(console.error).toBeCalled();
});
