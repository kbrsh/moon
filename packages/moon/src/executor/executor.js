import { components, data, setViewNew, viewCurrent, viewNew, viewOld } from "../util/globals";
import { types } from "../util/util";

/**
 * Start time
 */
let executeStart;

/**
 * List of patches
 */
const patches = [];

/**
 * Types of patches
 */
const patchTypes = {
	setAttributes: 0,
	appendElement: 1,
	removeElement: 2,
	replaceElement: 3
};

/**
 * Creates a DOM element from a view node.
 *
 * @param {Object} node
 * @returns {Element} DOM element
 */
function executeCreateElement(node) {
	if (node.type === types.element) {
		const element = document.createElement(node);
		const data = node.data;
		const children = data.children;

		for (let key in data) {
			element.setAttribute(key, data[key]);
		}

		for (let i = 0; i < children.length; i++) {
			element.appendChild(executeCreateElement(children[i]));
		}

		return element;
	} else {
		return document.createTextNode(node.data[""]);
	}
}

/**
 * Walks the view and executes components.
 *
 * @param {Array} nodes
 * @param {Array} parents
 * @param {Array} indexes
 */
function executeView(nodes, parents, indexes) {
	while (true) {
		let node = nodes.pop();
		const parent = parents.pop();
		const index = indexes.pop();

		if (node.type === types.component) {
			const nodeComponent = components[node.name](node.data);

			if (parent === null) {
				setViewNew(nodeComponent);
			} else {
				node = parent.data.children[index] = nodeComponent;
			}
		} else if (parent === null) {
			setViewNew(node);
		}

		const children = node.data.children;

		for (let i = 0; i < children.length; i++) {
			nodes.push(children[i]);
			parents.push(node);
			indexes.push(i);
		}

		if (nodes.length === 0) {
			break;
		} else if (performance.now() - executeStart >= 8) {
			requestAnimationFrame(() => {
				executeStart = performance.now();
				executeView(nodes, parents, indexes);
			});

			break;
		}
	}

	if (nodes.length === 0) {
		console.log(viewNew);
	}
}

/**
 * Applies the list of patches as DOM updates.
 */
function executePatch() {
	for (let i = 0; i < patches.length; i++) {
		const patch = patches[i];

		switch (patch.type) {
			case patchTypes.setAttributes: {
				const node = patch.node;
				const attributes = patch.attributes;

				for (let attribute in attributes) {
					node.setAttribute(attribute, attributes[attribute]);
				}

				break;
			}

			case patchTypes.appendElement: {
				const nodeParent = patch.nodeParent;

				nodeParent.appendChild(executeCreateElement(patch.nodeNew));

				break;
			}

			case patchTypes.removeElement: {
				const nodeParent = patch.nodeParent;

				nodeParent.removeChild(patch.nodeOld);

				break;
			}

			case patchTypes.replaceElement: {
				const nodeOld = patch.nodeOld;

				nodeOld.parentNode.replaceChild(
					executeCreateElement(patch.newNode),
					nodeOld
				);

				break;
			}
		}
	}
}

/**
 * Executes the call tree returned by view functions and finds changes over
 * multiple frames.
 *
 * @param {Object} nodeOld
 * @param {Object} nodeNew
 */
/*
function executeDiff(nodeOld, nodeNew) {
	let nodesOld = [nodeOld];
	let nodesNew = [nodeNew];
	let nodes = [];

	while (nodesNew.length !== 0) {
		const nodeOld = nodesOld.pop();
		const nodeNew = nodesNew.pop();

		if (nodeNew === nodeOld) {
			continue;
		}

		if (nodeNew.type === types.component) {
			nodeNew = components[nodeNew.name](nodeNew.data);
		}

		if (nodeNew.name === nodeOld.name) {
			effects.push({
				type: effectTypes.setAttributes,
				node: nodeOld.node,
				attributes: nodeNew.data
			});
		} else {
			effects.push({
				type: effectTypes.replaceElement,
				nodeOld: nodeOld.node,
				nodeNew: nodeNew
			});

			const children = nodeNew.data.children;

			for (let i = 0; i < children.length; i++) {
				nodes.push(children[i]);
			}
		}
	}

	while (nodes.length !== 0) {
		const node = nodes.pop();

		if (node.type === types.component) {
			const nodeComponent = components[node.name](node.data);

			// TODO: inline this
			for (let key in nodeComponent) {
				node[key] = nodeComponent[key];
			}
		}

		const children = node.data.children;

		for (let i = 0; i < children.length; i++) {
			nodes.push(children[i]);
		}
	}
}
*/

/**
 * Executor
 *
 * The executor runs in three phases.
 *
 * 1. View
 * 2. Diff
 * 3. Patch
 *
 * The view phase consists of walking the new tree and executing components.
 * This is done over multiple frames because component views can be slow, and
 * component trees can also be large enough to require it.
 *
 * The diff phase consists of walking the old and new tree while finding
 * differences. The differences are pushed as individual patches to a global
 * list of them. This is run over multiple frames because finding differences
 * between large component trees can take a while, especially from long lists.
 *
 * The patch phase consists of iterating through the patches and applying all
 * of them to mutate the DOM. These boil down to primitive DOM operations that
 * are all batched together to update the view. Rather than doing it along with
 * the diff phase, the patch is done in one frame to prevent an inconsistent
 * UI -- similar to screen tearing.
 */
export function execute() {
	executeStart = performance.now();
	executeView([viewCurrent(data)], [null], [0]);
}
