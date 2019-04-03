const typeRE = /<([\w\d-_]+)([^>]*?)(\/?)>/g;
const attributeRE = /\s*([\w\d-_]*)(?:=(?:("[\w\d-_]*"|'[\w\d-_]*')|{([\w\d-_]*)}))?/g;

export function lex(input) {
	input = input.trim();

	let tokens = [];

	for (let i = 0; i < input.length;) {
		const char = input[i];

		if (char === "<") {
			const nextChar = input[i + 1];

			if (nextChar === "/") {
				const closeIndex = input.indexOf(">", i + 2);
				const type = input.slice(i + 2, closeIndex);

				tokens.push({
					type: "tagClose",
					value: type
				});

				i = closeIndex + 1;
				continue;
			} else if (
				nextChar === "!" &&
				input[i + 2] === "-" &&
				input[i + 3] === "-"
			) {
				i = input.indexOf("-->", i + 4) + 3;
				continue;
			}

			typeRE.lastIndex = i;

			const typeExec = typeRE.exec(input);
			const typeMatch = typeExec[0];
			const type = typeExec[1];
			const attributesText = typeExec[2];
			const closingSlash = typeExec[3];
			const attributes = {};
			let attributeExec;

			while (
				(attributeExec = attributeRE.exec(attributesText)) !==
				null
			) {
				const attributeMatch = attributeExec[0];
				const attributeKey = attributeExec[1];
				const attributeValue = attributeExec[2];
				const attributeExpression = attributeExec[3];

				if (attributeMatch.length === 0) {
					attributeRE.lastIndex += 1;
				} else {
					attributes[attributeKey] =
						attributeExpression === undefined ?
						attributeValue :
						attributeExpression;
				}
			}

			tokens.push({
				type: "tagOpen",
				value: type,
				attributes,
				closed: closingSlash === "/"
			});

			i += typeMatch.length;
		} else if (char === "{") {
			let expression = "";

			for (i += 1; i < input.length; i++) {
				const char = input[i];

				if (char === "}") {
					break;
				} else {
					expression += char;
				}
			}

			tokens.push({
				type: "tagOpen",
				value: "Text",
				attributes: {
					"": expression
				},
				closed: true
			});

			i += 1;
		} else {
			let text = "";

			for (; i < input.length; i++) {
				const char = input[i];

				if (char === "<") {
					break;
				} else {
					text += char;
				}
			}

			tokens.push({
				type: "tagOpen",
				value: "Text",
				attributes: {
					"": `"${text}"`
				},
				closed: true
			});
		}
	}

	return tokens;
}
