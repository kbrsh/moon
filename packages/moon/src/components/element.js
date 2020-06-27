import { View } from "moon/src/wrappers/view";

/**
 * Empty children
 */
const childrenEmpty = [];

/**
 * Empty references
 */
const referencesEmpty = {};

/**
 * Element component
 */
export function element(name) {
	return data => m => {
		if ("children" in data) {
			const dataChildren = data.children;
			const children = [];
			const view = new View(name, data, children, referencesEmpty);

			for (let i = 0; i < dataChildren.length; i++) {
				m.view = view;
				m = dataChildren[i](m);

				if (m.view !== view) {
					children.push(m.view);
				}
			}

			m.view = view;
		} else {
			m.view = new View(name, data, childrenEmpty, referencesEmpty);
		}

		return m;
	};
}

/**
 * Empty element component
 */
export function elementEmpty(name) {
	return data => m => {
		m.view = new View(name, data, childrenEmpty, referencesEmpty);

		return m;
	};
}

/**
 * References element component
 */
export function elementReferences(name) {
	return data => m => {
		const references = {};

		for (const key in data) {
			if (key[0] === "*") {
				const value = data[key];

				references[key] = {
					value: value.value,
					get: value.get(m),
					set: value.set
				};
			}
		}

		m.view = new View(name, data, childrenEmpty, references);

		return m;
	};
}
