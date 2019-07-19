import NodeNew from "moon/src/view/NodeNew";

/**
 * Returns a new node.
 *
 * @param {number} type
 * @param {string} name
 * @param {Object} data
 * @param {Array} children
 */
export default function m(type, name, data, children) {
	return new NodeNew(type, name, data, children);
}
