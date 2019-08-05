/**
 * New Node Constructor
 *
 * @param {string} name
 * @param {Object} data
 * @param {Array} children
 */
export default function NodeNew(name, data, children) {
	this.name = name;
	this.data = data;
	this.children = children;
}
