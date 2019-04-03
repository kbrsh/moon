function parseElements(start, end, tokens) {
	const length = end - start;

	if (length === 0) {
		return [];
	} else {
		for (
			let elementEnd = start + 1;
			elementEnd <= end;
			elementEnd++
		) {
			const element = parse(start, elementEnd, tokens);

			if (element !== null) {
				const elements = parseElements(elementEnd, end, tokens);

				if (elements !== null) {
					return [element, ...elements];
				}
			}
		}

		return null;
	}
}

export function parse(start, end, tokens) {
	const firstToken = tokens[start];
	const lastToken = tokens[end - 1];
	const length = end - start;

	if (length === 0) {
		return null;
	} else if (length === 1) {
		if (
			firstToken.type === "tagOpen" &&
			firstToken.closed === true
		) {
			return {
				type: firstToken.value,
				attributes: firstToken.attributes,
				children: []
			};
		} else {
			return null;
		}
	} else {
		if (
			firstToken.type === "tagOpen" &&
			lastToken.type === "tagClose" &&
			firstToken.value === lastToken.value
		) {
			const children = parseElements(start + 1, end - 1, tokens);

			if (children === null) {
				return null;
			} else {
				return {
					type: firstToken.value,
					attributes: firstToken.attributes,
					children
				};
			}
		} else {
			return null;
		}
	}
}
