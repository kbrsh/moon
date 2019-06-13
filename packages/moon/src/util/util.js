/**
 * View node types.
 */
export const types = {
	element: 0,
	text: 1,
	component: 2
};

/**
 * Old Node Constructor
 */
export function NodeOld(node, element, children) {
	this.node = node;
	this.element = element;
	this.children = children;
}

/**
 * New Node Constructor
 */
export function NodeNew(type, name, data) {
	this.type = type;
	this.name = name;
	this.data = data;
}

/**
 * Logs an error message to the console.
 * @param {string} message
 */
export function error(message) {
	console.error("[Moon] ERROR: " + message);
}

/**
 * Returns a value or a default fallback if the value is undefined.
 *
 * @param value
 * @param fallback
 * @returns Value or default fallback
 */
export function defaultValue(value, fallback) {
	return value === undefined ? fallback : value;
}

/**
 * Returns a new node.
 *
 * @param {Number} type
 * @param {String} name
 * @param {Object} data
 */
export function m(type, name, data) {
	return new NodeNew(type, name, data);
}
