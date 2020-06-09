import { View } from "moon/src/wrappers/view";

/**
 * Reference bind events
 */
const references = {
	input: {
		"*value": {
			key: "value",
			event: "input"
		}
	}
};

/**
 * Empty children
 */
const childrenEmpty = [];

/**
 * Element component
 */
export function element(name) {
	return data => m => {
		let children;

		if ("children" in data) {
			const dataChildren = data.children;
			children = [];

			for (let i = 0; i < dataChildren.length; i++) {
				m = dataChildren[i](m);
				children.push(m.view);
			}
		} else {
			children = childrenEmpty;
		}

		m.view = new View(name, data, children);

		return m;
	};
}

/**
 * Empty element component
 */
export function elementEmpty(name) {
	return data => m => {
		m.view = new View(name, data, childrenEmpty);

		return m;
	};
}
