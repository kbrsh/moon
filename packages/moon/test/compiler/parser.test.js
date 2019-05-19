import { lex } from "../../src/compiler/lexer/lexer";
import { parse } from "../../src/compiler/parser/parser";

function parseTest(input) {
	return parse(lex(input));
}

test("parse empty element", () => {
	expect(parseTest(`<div></div>`)).toEqual({
		"name": "div",
		"attributes": {},
		"children": []
	});
});

test("parse text element", () => {
	expect(parseTest(`test text`)).toEqual({
		"name": "text",
		"attributes": {
			"": {
				value: `"test text"`,
				isStatic: true
			}
		},
		"children": []
	});
});

test("parse nested elements", () => {
	expect(parseTest(`
		<div dynamic={true}>
			<h1>Title</h1>
			<p color="blue">Text</p>
		</div>
	`)).toEqual({
		"name": "div",
		"attributes": {
			"dynamic": {"value": "true", "isStatic": true}
		},
		"children": [
			{
				"name": "h1",
				"attributes": {},
				"children": [
					{
						"name": "text",
						"attributes": {
							"": {"value": "\"Title\"", "isStatic": true}
						},
						"children": []
					}
				]
			},
			{
				"name": "p",
				"attributes": {
					"color": {"value": "\"blue\"", "isStatic": true}
				},
				"children": [
					{
						"name": "text",
						"attributes": {
							"": {"value": "\"Text\"", "isStatic": true}
						},
						"children": []
					}
				]
			}
		]
	});
});

test("parse error from invalid view", () => {
	console.error = jest.fn();

	expect(parseTest(`
		<div>
			<p>text?
			</h1></input>
		</div>
	`).constructor.name).toBe("ParseError");
	expect(console.error).toBeCalled();
});

test("parse error from invalid children", () => {
	console.error = jest.fn();

	expect(parseTest(`
		<div>
			<h1>header</h1>
			<p>unclosed
		</div>
	`).constructor.name).toBe("ParseError");
	expect(console.error).toBeCalled();
});

test("parse error from empty element", () => {
	console.error = jest.fn();

	expect(parseTest("").constructor.name).toBe("ParseError");
	expect(console.error).toBeCalled();
});
