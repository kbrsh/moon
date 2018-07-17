import { parseTemplate } from "./template";
import { whitespaceRE, error } from "./util";
import { isComponentType } from "../util";

const valueEndRE = /[\s/>]/;

const parseAttributes = (index, input, length, attributes) => {
	while (index < length) {
		let char = input[index];

		if (char === "/" || char === ">") {
			break;
		} else if (whitespaceRE.test(char)) {
			index += 1;
			continue;
		} else {
			let key = "";
			let value;
			let expression = false;

			while (index < length) {
				char = input[index];

				if (char === "/" || char === ">" || whitespaceRE.test(char)) {
					value = "";
					break;
				} else if (char === "=") {
					index += 1;
					break;
				} else {
					key += char;
					index += 1;
				}
			}

			if (value === undefined) {
				let quote;
				value = "";
				char = input[index];

				if (char === "\"" || char === "'") {
					quote = char;
					index += 1;
				} else if (char === "{") {
					quote = "}";
					expression = true;
					index += 1;
				} else {
					quote = valueEndRE;
				}

				while (index < length) {
					char = input[index];

					if ((typeof quote === "object" && quote.test(char)) || char === quote) {
						index += 1;
						break;
					} else {
						value += char;
						index += 1;
					}
				}
			}

			let dynamic = false;

			if (expression) {
				const template = parseTemplate(value);
				value = template.expression;
				dynamic = template.dynamic;
			}

			attributes.push({
				key: key,
				value: value,
				expression: expression,
				dynamic: dynamic
			});
		}
	}

	return index;
};

export const parseOpeningTag = (index, input, length, stack) => {
	let element = {
		type: "",
		attributes: [],
		children: []
	};

	while (index < length) {
		const char = input[index];

		if (char === "/" || char === ">") {
			const attributes = element.attributes;
			const lastIndex = stack.length - 1;

			if (char === "/") {
				index += 1;
			} else {
				stack.push(element);
			}

			for (let i = 0; i < attributes.length;) {
				const attribute = attributes[i];

				if (isComponentType(attribute.key)) {
					element = {
						type: attribute.key,
						attributes: [{
							key: "",
							value: attribute.value,
							expression: attribute.expression,
							dynamic: attribute.dynamic
						}],
						children: [element]
					};
					attributes.splice(i, 1);
				} else {
					i += 1;
				}
			}

			stack[lastIndex].children.push(element);

			index += 1;
			break;
		} else if ((whitespaceRE.test(char) && (index += 1)) || char === "=") {
			index = parseAttributes(index, input, length, element.attributes);
		} else {
			element.type += char;
			index += 1;
		}
	}

	return index;
};

export const parseClosingTag = (index, input, length, stack) => {
	let type = "";

	for(; index < length; index++) {
		const char = input[index];

		if (char === ">") {
			index += 1;
			break;
		} else {
			type += char;
		}
	}

	const lastElement = stack.pop();
	if (type !== lastElement.type && process.env.MOON_ENV === "development") {
		error(`Unclosed tag "${lastElement.type}"`);
	}

	return index;
};
