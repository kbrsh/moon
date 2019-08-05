import NodeNew from "moon/src/view/NodeNew";

/**
 * Returns a new node.
 *
 * @param {string} name
 * @param {Object} data
 * @param {Array} children
 */
export default function m(name, data, children) {
	return new NodeNew(name, data, children);
}
