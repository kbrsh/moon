/**
 * Generate a parser value node.
 *
 * @param {object} tree
 * @returns {string|object} generator result
 */
function generateValue(tree) {
	if (tree.type === "block") {
		// In values, blocks are only generated to the expression inside of them.
		return `(${generate(tree.value[1])})`;
	} else {
		// All other value types are generated normally.
		return generate(tree);
	}
}

/**
 * Generator
 *
 * The generator takes parse nodes and converts them to strings representing
 * JavaScript code. All code is generated the same, but Moon view expressions
 * are converted to function calls or variable references.
 *
 * @param {object} tree
 * @returns {string|object} generator result
 */
export default function generate(tree) {
	const type = tree.type;

	if (typeof tree === "string") {
		return tree;
	} else if (Array.isArray(tree)) {
		let output = "";

		for (let i = 0; i < tree.length; i++) {
			output += generate(tree[i]);
		}

		return output;
	} else if (type === "block") {
		return generate(tree.value);
	} else if (type === "text") {
		return `Moon.view.m.text({value:${JSON.stringify(generate(tree.value))}})`;
	} else if (type === "attributes") {
		const value = tree.value;
		let output = "";
		let separator = "";

		for (let i = 0; i < value.length; i++) {
			const pair = value[i];
			output += `${separator}"${generate(pair[0])}":${generateValue(pair[2])}${generate(pair[3])}`;
			separator = ",";
		}

		return {
			output,
			separator
		};
	} else if (type === "node") {
		// Nodes represent a variable reference.
		const value = tree.value;

		return generate(value[1]) + generateValue(value[2]) + generate(value[3]);
	} else if (type === "nodeData") {
		// Data nodes represent calling a function with either a custom data
		// expression or an object using attribute syntax.
		const value = tree.value;
		const data = value[4];

		return `${generate(value[1])}${generateValue(value[2])}${generate(value[3])}(${data.type === "attributes" ? `{${generate(data).output}}` : generate(data.value[1])})`;
	} else if (type === "nodeDataChildren") {
		// Data and children nodes represent calling a function with a data
		// object using attribute syntax and children.
		const value = tree.value;
		const data = generate(value[4]);
		const children = value[6];
		const childrenLength = children.length;
		let outputChildren;

		if (childrenLength === 0) {
			outputChildren = "";
		} else {
			let separator = "";
			outputChildren = data.separator + "children:[";

			for (let i = 0; i < childrenLength; i++) {
				const child = children[i];

				if (child.type === "block") {
					outputChildren += `${separator}Moon.view.m.text({value:${generate(child.value[1])}})`;
				} else {
					outputChildren += separator + generate(child);
				}

				separator = ",";
			}

			outputChildren += "]";
		}

		return `${generate(value[1])}${generateValue(value[2])}${generate(value[3])}({${data.output}${outputChildren}})`;
	}
}
