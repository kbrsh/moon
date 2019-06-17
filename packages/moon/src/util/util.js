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
export function NodeNew(type, name, data, children) {
	this.type = type;
	this.name = name;
	this.data = data;
	this.children = children;
}

/**
 * Logs an error message to the console.
 * @param {string} message
 */
export function error(message) {
	console.error("[Moon] ERROR: " + message);
}

/**
 * Returns a new node.
 *
 * @param {number} type
 * @param {string} name
 * @param {Object} data
 * @param {Array} children
 */
export function m(type, name, data, children) {
	return new NodeNew(type, name, data, children);
}
