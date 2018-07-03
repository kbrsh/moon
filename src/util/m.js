import { components } from "../component/components";

const createElement = (type) => document.createElement(type);

const createTextNode = (content) => document.createTextNode(content);

const createComment = () => document.createComment("");

const setAttribute = (element, key, value) => {
	element.setAttribute(key, value);
};

const addEventListener = (element, type, handler) => {
	element.addEventListener(type, handler);
};

const setTextContent = (element, content) => {
	element.textContent = content;
};

const appendChild = (element, parent) => {
	parent.appendChild(element);
};

const removeChild = (element, parent) => {
	parent.removeChild(element);
};

const insertBefore = (element, reference, parent) => {
	parent.insertBefore(element, reference);
};

const directiveIf = (ifState, ifConditions, ifPortions, ifParent) => {
	for (let i = 0; i < ifConditions.length; i++) {
		if (ifConditions[i]) {
			const ifPortion = ifPortions[i];

			if (ifState === ifPortion) {
				ifPortion[1]();
			} else {
				if (ifState) {
					ifState[2]();
				}

				ifPortion[0](ifParent);
				ifPortion[1]();

				ifState = ifPortion;
			}

			return ifState;
		}
	}
};

const directiveFor = (forIdentifiers, forLocals, forValue, forPortion, forPortions, forParent) => {
	const previousLength = forPortions.length;
	const nextLength = forValue.length;
	const maxLength = previousLength > nextLength ? previousLength : nextLength;

	const keyIdentifier = forIdentifiers[1];
	const valueIdentifier = forIdentifiers[0];

	for (let i = 0; i < maxLength; i++) {
		if (i >= previousLength) {
			const forLocal = {};
			forLocal[keyIdentifier] = i;
			forLocal[valueIdentifier] = forValue[i];
			forLocals[i] = forLocal;

			const newForPortion = forPortion(forLocal);
			forPortions.push(newForPortion);

			newForPortion[0](forParent);
			newForPortion[1]();
		} else if (i >= nextLength) {
			forPortions.pop()[2]();
		} else {
			const forLocal = forLocals[i];
			forLocal[keyIdentifier] = i;
			forLocal[valueIdentifier] = forValue[i];

			forPortions[i][1]();
		}
	}
};

export const m = {
	c: components,
	ce: createElement,
	ctn: createTextNode,
	cc: createComment,
	sa: setAttribute,
	ael: addEventListener,
	stc: setTextContent,
	ac: appendChild,
	rc: removeChild,
	ib: insertBefore,
	di: directiveIf,
	df: directiveFor
};
