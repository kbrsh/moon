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
	expect(lex(`text test`)).toEqual([{"attributes": {"": {"value": "\"text test\"", "isStatic": true}}, "closed": true, "type": "tagOpen", "value": "text"}]);
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
				"": {
					"value": "\"text\"",
					"isStatic": true
				}
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
	expect(lex(`{data + 1}`)).toEqual([{"attributes": {"": {"value": "data.data + 1", isStatic: false}}, "closed": true, "type": "tagOpen", "value": "text"}]);
});

test("lex attributes", () => {
	expect(lex(`<div id="test-id" class='test-class' for='input' dynamic={true} local={$local} self>`)).toEqual([{"attributes": {"id": {"value": "\"test-id\"", "isStatic": true}, "className": {"value": "'test-class'", "isStatic": true}, "htmlFor": {"value": "'input'", "isStatic": true}, "dynamic": {"value": "true", "isStatic": true}, "local": {"value": "$local", "isStatic": false}, "self": {"value": "\"\"", "isStatic": true}}, "closed": false, "type": "tagOpen", "value": "div"}]);
});

test("lex events", () => {
	expect(lex(`<div id="test-id" class='test-class' dynamic={true} self @event={doSomething}>`)).toEqual([{"attributes": {"id": {"value": "\"test-id\"", "isStatic": true}, "className": {"value": "'test-class'", "isStatic": true}, dynamic: {"value": "true", "isStatic": true}, "@event": {"value": "[data.doSomething,data]", "isStatic": false}, self: {"value": "\"\"", "isStatic": true}}, "closed": false, "type": "tagOpen", "value": "div"}]);
});

test("lex bind", () => {
	expect(lex(`<div><input id="test" *value/><textarea *value></textarea><input type="checkbox" *checkboxValue/><input type="radio" *radioValue/><select *selectValue><option value="option1">Option 1</option><option value="option2">Option 2</option><option value="option3">Option 3</option></select></div>`)).toEqual([{"type":"tagOpen","value":"div","attributes":{},"closed":false},{"type":"tagOpen","value":"input","attributes":{"id":{"value":"\"test\"","isStatic":true},"value":{"value":"data.value","isStatic":false},"@input":{"value":"[function(me){Moon.set({\"value\":me.target.value});},data]","isStatic":true}},"closed":true},{"type":"tagOpen","value":"textarea","attributes":{"value":{"value":"data.value","isStatic":false},"@input":{"value":"[function(me){Moon.set({\"value\":me.target.value});},data]","isStatic":true}},"closed":false},{"type":"tagClose","value":"textarea"},{"type":"tagOpen","value":"input","attributes":{"type":{"value":"\"checkbox\"","isStatic":true},"checked":{"value":"data.checkboxValue","isStatic":false},"@change":{"value":"[function(me){Moon.set({\"checkboxValue\":me.target.checked});},data]","isStatic":true}},"closed":true},{"type":"tagOpen","value":"input","attributes":{"type":{"value":"\"radio\"","isStatic":true},"checked":{"value":"data.radioValue","isStatic":false},"@change":{"value":"[function(me){Moon.set({\"radioValue\":me.target.checked});},data]","isStatic":true}},"closed":true},{"type":"tagOpen","value":"select","attributes":{"value":{"value":"data.selectValue","isStatic":false},"@change":{"value":"[function(me){Moon.set({\"selectValue\":me.target.value});},data]","isStatic":true}},"closed":false},{"type":"tagOpen","value":"option","attributes":{"value":{"value":"\"option1\"","isStatic":true}},"closed":false},{"type":"tagOpen","value":"text","attributes":{"":{"value":"\"Option 1\"","isStatic":true}},"closed":true},{"type":"tagClose","value":"option"},{"type":"tagOpen","value":"option","attributes":{"value":{"value":"\"option2\"","isStatic":true}},"closed":false},{"type":"tagOpen","value":"text","attributes":{"":{"value":"\"Option 2\"","isStatic":true}},"closed":true},{"type":"tagClose","value":"option"},{"type":"tagOpen","value":"option","attributes":{"value":{"value":"\"option3\"","isStatic":true}},"closed":false},{"type":"tagOpen","value":"text","attributes":{"":{"value":"\"Option 3\"","isStatic":true}},"closed":true},{"type":"tagClose","value":"option"},{"type":"tagClose","value":"select"},{"type":"tagClose","value":"div"}]);
});

test("lex comments", () => {
	expect(lex(`<!-- comment -->`)).toEqual([]);
});

test("opening tag token to string", () => {
	const input = "<div>";
	expect(tokenString(lex(input)[0])).toBe(input);
});

test("opening tag token with attributes to string", () => {
	const input = `<div id="test-id" className='test-class' expression={dynamic}>`;
	expect(tokenString(lex(input)[0])).toBe(input.replace("dynamic", "data.dynamic"));
});

test("self-closing tag token to string", () => {
	const input = `<input/>`;
	expect(tokenString(lex(input)[0])).toBe(input);
});

test("self-closing tag token with attributes to string", () => {
	const input = `<input id="test-id" className='test-class' expression={dynamic}/>`;
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
