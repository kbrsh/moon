import { getElement, setElement, createElement, createTextNode, createComment, attributeValue, setAttribute, addEventListener, setTextContent, appendChild, removeChild, insertBefore, directiveIf, directiveFor } from "./util";

const generateMount = (element, parent, insert) => insert === undefined ? appendChild(element, parent) : insertBefore(element, insert, parent);

export const generateAll = (element, parent, root, insert) => {
	switch (element.type) {
		case "#if": {
			element.ifState = root.nextElement++;
			element.ifReference = root.nextElement++;

			const ifConditions = root.nextElement++;
			const ifPortions = root.nextElement++;
			let ifConditionsCode = "[";
			let ifPortionsCode = "[";
			let separator = "";

			const siblings = parent.children;
			for (let i = siblings.indexOf(element); i < siblings.length; i++) {
				const sibling = siblings[i];
				if (sibling.type === "#if" || sibling.type === "#elseif" || sibling.type === "#else") {
					ifConditionsCode += separator + (sibling.type === "#else" ? "true" : attributeValue(sibling.attributes[0]));

					ifPortionsCode += separator + "function(locals){" + generate({
						element: root.nextElement,
						nextElement: root.nextElement + 1,
						type: "#root",
						attributes: [],
						children: sibling.children
					}, element.ifReference) + "}({})";

					separator = ",";
				} else {
					break;
				}
			}

			return [
				setElement(element.ifReference, createComment()) +
				generateMount(element.ifReference, parent.element, insert) +
				setElement(ifPortions, ifPortionsCode + "];"),

				setElement(ifConditions, ifConditionsCode + "];") +
				setElement(element.ifState, directiveIf(element.ifState, element.ifReference, ifConditions, ifPortions, parent.element)),

				getElement(element.ifState) + "[2]();"
			];
		}
		case "#elseif":
		case "#else": {
			return ["", "", ""];
		}
		case "#for": {
			const forAttribute = attributeValue(element.attributes[0]);
			let forIdentifiers = "[";
			let forValue = "";

			const forReference = root.nextElement++;
			const forPortion = root.nextElement++;
			const forPortions = root.nextElement++;
			const forLocals = root.nextElement++;

			let forIdentifier = "", separator = "";

			for (let i = 0; i < forAttribute.length; i++) {
				const char = forAttribute[i];

				if (char === "," || (char === " " && forAttribute[i + 1] === "i" && forAttribute[i + 2] === "n" && forAttribute[i + 3] === " " && (i += 3))) {
					forIdentifiers += separator + "\"" + forIdentifier.substring(7) + "\"";
					forIdentifier = "";
					separator = ",";
				} else {
					forIdentifier += char;
				}
			}

			forIdentifiers += "]";
			forValue += forIdentifier;

			return [
				setElement(forReference, createComment()) +
				generateMount(forReference, parent.element, insert) +
				setElement(forPortion, "function(locals){" + generate({
					element: root.nextElement,
					nextElement: root.nextElement + 1,
					type: "#root",
					attributes: [],
					children: element.children
				}, forReference) + "};") +
				setElement(forPortions, "[];") +
				setElement(forLocals, "[];"),

				directiveFor(forIdentifiers, forValue, forReference, forPortion, forPortions, forLocals, parent.element),

				directiveFor(forIdentifiers, "[]", forReference, forPortion, forPortions, forLocals, parent.element)
			];
		}
		case "#text": {
			const textAttribute = element.attributes[0];
			const textElement = root.nextElement++;

			const textCode = setTextContent(textElement, attributeValue(textAttribute));
			let createCode = setElement(textElement, createTextNode("\"\""));
			let updateCode = "";

			if (textAttribute.dynamic) {
				updateCode += textCode;
			} else {
				createCode += textCode;
			}

			return [createCode + generateMount(textElement, parent.element, insert), updateCode, removeChild(textElement, parent.element)];
		}
		default: {
			const attributes = element.attributes;
			const children = element.children;
			element.element = root.nextElement++;

			let createCode = setElement(element.element, createElement(element.type));
			let updateCode = "";

			for (let i = 0; i < attributes.length; i++) {
				const attribute = attributes[i];
				let attributeCode;

				if (attribute.key[0] === "@") {
					let eventType, eventHandler;

					if (attribute.key === "@bind") {
						const bindVariable = attributeValue(attribute);
						attributeCode = `${getElement(element.element)}.value=${bindVariable};`;
						eventType = "input";
						eventHandler = `${bindVariable}=$event.target.value;instance.update();`;
					} else {
						attributeCode = "";
						eventType = attribute.key.substring(1);
						eventHandler =	`locals.$event=$event;${attributeValue(attribute)};`;
					}

					createCode += addEventListener(element.element, eventType, `function($event){${eventHandler}}`);
				} else {
					attributeCode = setAttribute(element.element, attribute);
				}

				if (attribute.dynamic) {
					updateCode += attributeCode;
				} else {
					createCode += attributeCode;
				}
			}

			for (let i = 0; i < children.length; i++) {
				const childCode = generateAll(children[i], element, root);
				createCode += childCode[0];
				updateCode += childCode[1];
			}

			return [createCode + generateMount(element.element, parent.element, insert), updateCode, removeChild(element.element, parent.element)];
		}
	}
};

export const generate = (tree, insert) => {
	const children = tree.children;
	let create = "";
	let update = "";
	let destroy = "";

	for (let i = 0; i < children.length; i++) {
		const generated = generateAll(children[i], tree, tree, insert);

		create += generated[0];
		update += generated[1];
		destroy += generated[2];
	}

	let prelude = "var m" + tree.element;
	for (let i = tree.element + 1; i < tree.nextElement; i++) {
		prelude += `,m${i}`;
	}

	return `${prelude};return [function($_){${setElement(tree.element, "$_;")}${create}},function(){${update}},function(){${destroy}}];`;
};
