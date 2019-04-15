import { components, data, setViewNew, viewCurrent, viewNew, viewOld } from "../util/globals";
import { types } from "../util/util";

/**
 * Start time
 */
let executeStart;

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
		const element = document.createElement(node.name);
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
 * Walks through the view and executes components.
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
			executeDiff(viewOld, viewNew, []);

			break;
		} else if (performance.now() - executeStart >= 8) {
			requestAnimationFrame(() => {
				executeStart = performance.now();
				executeView(nodes, parents, indexes);
			});

			break;
		}
	}
}

/**
 * Finds changes between a new and old tree and creates a list of patches to
 * execute.
 *
 * @param {Object} nodeOld
 * @param {Object} nodeNew
 * @param {Array} patches
 */
function executeDiff(nodeOld, nodeNew, patches) {
	let nodesOld = [nodeOld];
	let nodesNew = [nodeNew];

	while (true) {
		const nodeOld = nodesOld.pop();
		const nodeNew = nodesNew.pop();

		if (nodeOld === nodeNew) {
			continue;
		} else if (nodeOld.name !== nodeNew.name) {
			patches.push({
				type: patchTypes.replaceElement,
				nodeOld: nodeOld,
				nodeNew: nodeNew,
				nodeParent: null
			});
		} else {
			patches.push({
				type: patchTypes.setAttributes,
				nodeOld: nodeOld,
				nodeNew: nodeNew,
				nodeParent: null
			});

			const childrenOld = nodeOld.data.children;
			const childrenNew = nodeNew.data.children;

			const childrenOldLength = childrenOld.length;
			const childrenNewLength = childrenNew.length;

			if (childrenOldLength === childrenNewLength) {
				// If the children have the same length then update both as usual.
				for (let i = 0; i < childrenOldLength; i++) {
					nodesOld.push(childrenOld[i]);
					nodesNew.push(childrenNew[i]);
				}
			} else if (childrenOldLength > childrenNewLength) {
				// If there are more old children than new children, update the
				// corresponding ones and remove the extra old children.
				for (let i = 0; i < childrenNewLength; i++) {
					nodesOld.push(childrenOld[i]);
					nodesNew.push(childrenNew[i]);
				}

				for (let i = childrenNewLength; i < childrenOldLength; i++) {
					patches.push({
						type: patchTypes.removeElement,
						nodeOld: childrenOld[i],
						nodeNew: null,
						nodeParent: nodeOld
					});
				}
			} else {
				// If there are more new children than old children, update the
				// corresponding ones and append the extra new children.
				for (let i = 0; i < childrenOldLength; i++) {
					nodesOld.push(childrenOld[i]);
					nodesNew.push(childrenNew[i]);
				}

				for (let i = childrenOldLength; i < childrenNewLength; i++) {
					patches.push({
						type: patchTypes.appendElement,
						nodeOld: null,
						nodeNew: childrenNew[i],
						nodeParent: nodeOld
					});
				}
			}
		}

		if (nodesOld.length === 0) {
			executePatch(patches);

			break;
		} else if (performance.now() - executeStart >= 8) {
			requestAnimationFrame(() => {
				executeStart = performance.now();
				executeDiff(nodesOld, nodesNew, patches);
			});

			break;
		}
	}
}

/**
 * Applies the list of patches as DOM updates.
 *
 * @param {Array} patches
 */
function executePatch(patches) {
	for (let i = 0; i < patches.length; i++) {
		const patch = patches[i];

		switch (patch.type) {
			case patchTypes.setAttributes: {
				const nodeOld = patch.nodeOld;
				const nodeOldNode = nodeOld.node;
				const nodeNewData = patch.nodeNew.data;

				nodeOld.data = nodeNewData;

				for (let key in nodeNewData) {
					nodeOldNode.setAttribute(key, nodeNewData[key]);
				}

				break;
			}

			case patchTypes.appendElement: {
				const nodeNew = patch.nodeNew;
				const nodeParent = patch.nodeParent;
				const nodeNewNode = executeCreateElement(nodeNew);

				nodeParent.data.children.push({
					type: nodeNew.type,
					name: nodeNew.name,
					data: nodeNew.data,
					node: nodeNewNode
				});

				nodeParent.node.appendChild(nodeNewNode);

				break;
			}

			case patchTypes.removeElement: {
				const nodeParent = patch.nodeParent;

				nodeParent.data.children.pop();
				nodeParent.node.removeChild(patch.nodeOld);

				break;
			}

			case patchTypes.replaceElement: {
				const nodeOld = patch.nodeOld;
				const nodeNew = patch.nodeNew;
				const nodeOldNode = nodeOld.node;

				nodeOld.type = nodeNew.type;
				nodeOld.name = nodeNew.name;
				nodeOld.data = nodeNew.data;
				nodeOld.node = executeCreateElement(nodeNew);

				nodeOldNode.parentNode.replaceChild(nodeOld.node, nodeOldNode);

				break;
			}
		}
	}
}

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
