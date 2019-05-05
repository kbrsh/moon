const cssRE = /([^,:{}]+)(,|:[^,:{}+]+|{[^{}]+})/g;
const trailingWhitespaceRE = /\s*$/;

export function addClass(element, name) {
	const attributes = element.attributes;
	const children = element.children;

	const className = attributes.class;

	if (className === undefined) {
		attributes.class = `"${name}"`;
	} else if (className[0] === "\"" || className[0] === "'") {
		attributes.class = `${className[0]}${name} ${className.slice(1)}`;
	} else {
		attributes.class += ` + " ${name}"`;
	}

	for (let i = 0; i < children.length; i++) {
		module.exports.addClass(children[i], name);
	}
}

export function scopeCSS(scope, css) {
	return css.replace(cssRE, (match, selector, rule) =>
		selector.replace(trailingWhitespaceRE, "") + "." + scope + rule
	);
}
