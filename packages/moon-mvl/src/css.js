const cssRE = /([^,{}]+)(,|{[^{}]+})/g;
const trailingWhitespaceRE = /\s*$/;

module.exports.addClass = (element, name) => {
	const attributes = element.attributes;
	const children = element.children;
	let value = name;
	let expression = false;
	let dynamic = false;

	for (let i = 0; i < attributes.length; i++) {
		const attribute = attributes[i];
		if (attribute.key === "class") {
			if (attribute.expression) {
				value = `(${attribute.value}) + " ${name}"`;
				expression = attribute.expression;
				dynamic = attribute.dynamic;
			} else {
				value = `${attribute.value} ${name}`;
			}

			attributes.splice(i, 1);
			break;
		}
	}

	attributes.push({
		key: "class",
		value: value,
		expression: expression,
		dynamic: dynamic
	});

	for (let i = 0; i < children.length; i++) {
		module.exports.addClass(children[i], name);
	}

	return element;
};

module.exports.scopeCSS = (scope, css) => {
	return css.replace(cssRE, (match, selector, rule) => {
		return selector.replace(trailingWhitespaceRE, "") + "." + scope + rule;
	});
};
