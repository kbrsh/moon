/**
 * Matches whitespace.
 */
const whitespaceRE = /^\s+$/;

/**
 * Generate a parser value node.
 *
 * @param {object} tree
 * @returns {string} generator result
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
 * Generate a parser attributes node.
 *
 * @param {object} tree
 * @returns {object} generator result and separator
 */
function generateAttributes(tree) {
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
}

/**
 * Generator
 *
 * The generator takes parse nodes and converts them to strings representing
 * JavaScript code. All code is generated the same, but Moon view expressions
 * are converted to function calls or variable references.
 *
 * @param {object} tree
 * @returns {string} generator result
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
	} else if (type === "node") {
		// Nodes represent a variable reference.
		const value = tree.value;

		return generate(value[1]) + generateValue(value[2]) + generate(value[3]);
	} else if (type === "nodeData") {
		// Data nodes represent calling a function with either a custom data
		// expression or an object using attribute syntax.
		const value = tree.value;
		const data = value[4];

		return `${generate(value[1])}${generateValue(value[2])}${generate(value[3])}(${data.type === "attributes" ? `{${generateAttributes(data).output}}` : generate(data.value[1])})`;
	} else if (type === "nodeDataChildren") {
		// Data and children nodes represent calling a function with a data
		// object using attribute syntax and children.
		const value = tree.value;
		const data = generateAttributes(value[4]);
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
				const childType = child.type;

				if (childType === "text") {
					const childValue = generate(child.value);

					if (whitespaceRE.test(childValue) && childValue.indexOf("\n") !== -1) {
						// Text that is only whitespace with at least one newline is
						// ignored and added only to preserve newlines in the
						// generated code.
						outputChildren += childValue;
					} else {
						outputChildren += `${separator}Moon.view.m.text({value:${JSON.stringify(childValue)}})`;
						separator = ",";
					}
				} else if (childType === "block") {
					outputChildren += `${separator}Moon.view.m.text({value:${generate(child.value[1])}})`;
					separator = ",";
				} else {
					outputChildren += separator + generate(child);
					separator = ",";
				}
			}

			outputChildren += "]";
		}

		return `${generate(value[1])}${generateValue(value[2])}${generate(value[3])}({${data.output}${outputChildren}})`;
	}
}
