import { lex } from "../../src/compiler/lexer/lexer";
import { parse } from "../../src/compiler/parser/parser";

function parseTest(input) {
	return parse(lex(input));
}

test("parse empty element", () => {
	expect(parseTest(`<div></div>`)).toEqual({
		"type": "div",
		"attributes": {},
		"children": []
	});
});

test("parse text element", () => {
	expect(parseTest(`test text`)).toEqual({
		"type": "Text",
		"attributes": {
			"": `"test text"`
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
		"type": "div",
		"attributes": {
			"dynamic": "true"
		},
		"children": [
			{
				"type": "Text",
				"attributes": {
					"": "\"\n\t\t\t\""
				},
				"children": []
			},
			{
				"type": "h1",
				"attributes": {},
				"children": [
					{
						"type": "Text",
						"attributes": {
							"": "\"Title\""
						},
						"children": []
					}
				]
			},
			{
				"type": "Text",
				"attributes": {
					"": "\"\n\t\t\t\""
				},
				"children": []
			},
			{
				"type": "p",
				"attributes": {
					"color": "\"blue\""
				},
				"children": [
					{
						"type": "Text",
						"attributes": {
							"": "\"Text\""
						},
						"children": []
					}
				]
			},
			{
				"type": "Text",
				"attributes": {
					"": "\"\n\t\t\""
				},
				"children": []
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

test("parse error from empty element", () => {
	console.error = jest.fn();

	expect(parseTest("").constructor.name).toBe("ParseError");
	expect(console.error).toBeCalled();
});
