const expressionRE = /"[^"]*"|'[^']*'|\d+[a-zA-Z$_]\w*|\.[a-zA-Z$_]\w*|[a-zA-Z$_]\w*:|([a-zA-Z$_]\w*)/g;
const globals = ["NaN", "event", "false", "in", "null", "this", "true", "typeof", "undefined"];

export const parseTemplate = (expression) => {
	let dynamic = false;

	expression = expression.replace(expressionRE, function(match, name) {
		if (name === undefined || globals.indexOf(name) !== -1) {
			return match;
		} else {
			if (name[0] === "$") {
				return `locals.${name}`;
			} else {
				dynamic = true;
				return `instance.${name}`;
			}
		}
	});

	return {
		expression: expression,
		dynamic: dynamic
	};
};
