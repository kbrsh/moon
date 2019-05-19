const cssRE = /([^,:{}]+)(,|:[^,:{}+]+|{[^{}]+})/g;
const trailingWhitespaceRE = /\s*$/;

export function addClass(element, name) {
	const elementName = element.name;
	const elementChildren = element.children;

	if (
		elementName[0] === elementName[0].toLowerCase() &&
		elementName !== "if" &&
		elementName !== "else-if" &&
		elementName !== "else" &&
		elementName !== "for" &&
		elementName !== "text"
	) {
		const elementAttributes = element.attributes;

		if (elementAttributes.class === undefined) {
			elementAttributes.class = {
				value: `"${name}"`,
				isStatic: true
			};
		} else {
			elementAttributes.class.value += ` + " ${name}"`;
		}
	}

	for (let i = 0; i < elementChildren.length; i++) {
		addClass(elementChildren[i], name);
	}
}

export function scopeCSS(scope, css) {
	return css.replace(cssRE, (match, selector, rule) =>
		selector.replace(trailingWhitespaceRE, "") + "." + scope + rule
	);
}
