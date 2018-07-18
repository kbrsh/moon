const cssRE = /([@#.="':\w\s\-\[\]()]+)(\s*,|(?:{[\s\n]*(?:[\w\n]+:[\w\s\n(),]+;[\s\n]*)*}))/g;
const trailingWhitespaceRE = /\s*$/;

module.exports = (scope, css) => {
	return css.replace(cssRE, (match, selector, rule) => {
		return selector.replace(trailingWhitespaceRE, "") + "." + scope + rule;
	});
};
