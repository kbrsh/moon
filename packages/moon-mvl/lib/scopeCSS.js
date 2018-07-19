const cssRE = /([^,{}]+)(,|{[^{}]+})/g;
const trailingWhitespaceRE = /\s*$/;

module.exports = (scope, css) => {
	return css.replace(cssRE, (match, selector, rule) => {
		return selector.replace(trailingWhitespaceRE, "") + "." + scope + rule;
	});
};
