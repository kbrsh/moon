import compiler from "moon-compiler/src/index";

function parseTest(input) {
	return compiler.parse(input);
}

test("parse empty element", () => {
	expect(parseTest(`<div></div>`)).toEqual([[[{"type": "nodeDataChildren", "value": ["<", [], ["d", "i", "v"], [], {"type": "attributes", "value": []}, ">", [], "</", ["d", "i", "v"], ">"]}], "EOF"], 11]);
});

test("parse text element", () => {
	expect(parseTest(`<div>test text</div>`)).toEqual([[[{"type": "nodeDataChildren", "value": ["<", [], ["d", "i", "v"], [], {"type": "attributes", "value": []}, ">", [{"type": "text", "value": ["t", "e", "s", "t", " ", "t", "e", "x", "t"]}], "</", ["d", "i", "v"], ">"]}], "EOF"], 20]);
});

test("parse node", () => {
	expect(parseTest(`<div#>`)).toEqual([[[{"type":"node","value":["<",[],["d","i","v"],[],"#>"]}],"EOF"],6]);
});

test("parse node with string name", () => {
	expect(parseTest(`<"div"#>`)).toEqual([[[{"type": "node", "value": ["<", [], ["\"", ["d", "i", "v"], "\""], [], "#>"]}], "EOF"], 8]);
});

test("parse node with block name", () => {
	expect(parseTest(`<{dynamic}#>`)).toEqual([[[{"type": "node", "value": ["<", [], {"type": "block", "value": ["{", [["", ["d", "y", "n", "a", "m", "i", "c"]]], "}"]}, [], "#>"]}], "EOF"], 12]);
});

test("parse node data", () => {
	expect(parseTest(`<div/>`)).toEqual([[[{"type":"nodeData","value":["<",[],["d","i","v"],[],{"type":"attributes","value":[]},"/>"]}],"EOF"],6]);
});

test("parse node data with attributes", () => {
	expect(parseTest(`<div foo="bar" bar={1 + 2 + 3} baz="test"/>`)).toEqual([[[{"type":"nodeData","value":["<",[],["d","i","v"],[" "],{"type":"attributes","value":[[["f","o","o"],"=",["\"",["b","a","r"],"\""],[" "]],[["b","a","r"],"=",{"type":"block","value":["{",[["",["1"," ","+"," ","2"," ","+"," ","3"]]],"}"]},[" "]],[["b","a","z"],"=",["\"",["t","e","s","t"],"\""],[]]]},"/>"]}],"EOF"],43]);
});

test("parse node data with string name and attributes", () => {
	expect(parseTest(`<"div" foo="bar" bar={1 + 2 + 3} baz="test"/>`)).toEqual([[[{"type":"nodeData","value":["<",[],["\"",["d","i","v"],"\""],[" "],{"type":"attributes","value":[[["f","o","o"],"=",["\"",["b","a","r"],"\""],[" "]],[["b","a","r"],"=",{"type":"block","value":["{",[["",["1"," ","+"," ","2"," ","+"," ","3"]]],"}"]},[" "]],[["b","a","z"],"=",["\"",["t","e","s","t"],"\""],[]]]},"/>"]}],"EOF"],45]);
});

test("parse node data with block name and attributes", () => {
	expect(parseTest(`<{div} foo="bar" bar={1 + 2 + 3} baz="test"/>`)).toEqual([[[{"type":"nodeData","value":["<",[],{"type":"block","value":["{",[["",["d","i","v"]]],"}"]},[" "],{"type":"attributes","value":[[["f","o","o"],"=",["\"",["b","a","r"],"\""],[" "]],[["b","a","r"],"=",{"type":"block","value":["{",[["",["1"," ","+"," ","2"," ","+"," ","3"]]],"}"]},[" "]],[["b","a","z"],"=",["\"",["t","e","s","t"],"\""],[]]]},"/>"]}],"EOF"],45]);
});

test("parse node data with data", () => {
	expect(parseTest(`<div {foo}/>`)).toEqual([[[{"type": "nodeData", "value": ["<", [], ["d", "i", "v"], [" "], {"type": "block", "value": ["{", [["", ["f", "o", "o"]]], "}"]}, "/>"]}], "EOF"], 12]);
});

test("parse node data with string name and data", () => {
	expect(parseTest(`<"div" {foo}/>`)).toEqual([[[{"type": "nodeData", "value": ["<", [], ["\"", ["d", "i", "v"], "\""], [" "], {"type": "block", "value": ["{", [["", ["f", "o", "o"]]], "}"]}, "/>"]}], "EOF"], 14]);
});

test("parse node data with block name and data", () => {
	expect(parseTest(`<{div} {foo}/>`)).toEqual([[[{"type": "nodeData", "value": ["<", [], {"type": "block", "value": ["{", [["", ["d", "i", "v"]]], "}"]}, [" "], {"type": "block", "value": ["{", [["", ["f", "o", "o"]]], "}"]}, "/>"]}], "EOF"], 14]);
});

test("parse nested elements", () => {
	expect(parseTest(`
		<div dynamic={true}>
			<h1>Title</h1>
			<p color="blue">Text</p>
		</div>
	`)).toEqual([[[["",["\n","\t","\t"]],{"type":"nodeDataChildren","value":["<",[],["d","i","v"],[" "],{"type":"attributes","value":[[["d","y","n","a","m","i","c"],"=",{"type":"block","value":["{",[["",["t","r","u","e"]]],"}"]},[]]]},">",[{"type":"text","value":["\n","\t","\t","\t"]},{"type":"nodeDataChildren","value":["<",[],["h","1"],[],{"type":"attributes","value":[]},">",[{"type":"text","value":["T","i","t","l","e"]}],"</",["h","1"],">"]},{"type":"text","value":["\n","\t","\t","\t"]},{"type":"nodeDataChildren","value":["<",[],["p"],[" "],{"type":"attributes","value":[[["c","o","l","o","r"],"=",["\"",["b","l","u","e"],"\""],[]]]},">",[{"type":"text","value":["T","e","x","t"]}],"</",["p"],">"]},{"type":"text","value":["\n","\t","\t"]}],"</",["d","i","v"],">"]},["",["\n","\t"]]],"EOF"],80]);
});

test("parse nested elements with block name", () => {
	expect(parseTest(`
		<{div} dynamic={true}>
			<h1>Title</h1>
			<p color="blue">Text</p>
		</>
	`)).toEqual([[[["",["\n","\t","\t"]],{"type":"nodeDataChildren","value":["<",[],{"type":"block","value":["{",[["",["d","i","v"]]],"}"]},[" "],{"type":"attributes","value":[[["d","y","n","a","m","i","c"],"=",{"type":"block","value":["{",[["",["t","r","u","e"]]],"}"]},[]]]},">",[{"type":"text","value":["\n","\t","\t","\t"]},{"type":"nodeDataChildren","value":["<",[],["h","1"],[],{"type":"attributes","value":[]},">",[{"type":"text","value":["T","i","t","l","e"]}],"</",["h","1"],">"]},{"type":"text","value":["\n","\t","\t","\t"]},{"type":"nodeDataChildren","value":["<",[],["p"],[" "],{"type":"attributes","value":[[["c","o","l","o","r"],"=",["\"",["b","l","u","e"],"\""],[]]]},">",[{"type":"text","value":["T","e","x","t"]}],"</",["p"],">"]},{"type":"text","value":["\n","\t","\t"]}],"</",[],">"]},["",["\n","\t"]]],"EOF"],79]);
});

test("parse escaped character in regex", () => {
	expect(parseTest(`/\\//`)).toEqual([[[["/", [["\\", "/"]], "/"]], "EOF"], 4]);
});

test("parse backslash character in end of regex", () => {
	expect(parseTest(`/\\`)).toEqual([[[["/", ["\\"]]], "EOF"], 2]);
});

test("parse error on escaped newline in regex", () => {
	expect(parseTest(`/\\
/`)).toEqual({ expected: "EOF", index: 3 });
});

test("parse escaped delimiters in regex", () => {
	expect(parseTest(`/\\\\/`)).toEqual([[[["/", [["\\", "\\"]], "/"]], "EOF"], 4]);
});

test("parse error from not matching any character after escape", () => {
	expect(parseTest(`"\\`)).toEqual({"expected": "EOF", "index": 0});
});

test("parse error from invalid view", () => {
	expect(parseTest(`
		<div test="></div>
	`)).toEqual({"expected": "EOF", "index": 13});
});
