import { components, data, setViewNew, viewCurrent, viewNew, viewOld } from "../util/globals";
import { types } from "../util/util";

/**
 * Start time
 */
let executeStart;

/**
 * Function scheduled to run in next frame
 */
let executeNextFn = null;

/**
 * Types of patches
 */
const patchTypes = {
	updateText: 0,
	setAttributes: 1,
	appendElement: 2,
	removeElement: 3,
	replaceElement: 4
};

/**
 * Schedules a function to run in the next frame.
 * @param {Function} fn
 */
function executeNext(fn) {
	executeNextFn = fn;
	requestAnimationFrame(executeNextFn);
}

/**
 * Cancels the function scheduled to run in the next frame.
 */
function executeCancel() {
	if (executeNextFn !== null) {
		cancelAnimationFrame(executeNextFn);
		executeNextFn = null;
	}
}

/**
 * Creates a DOM element from a view node.
 *
 * @param {Object} node
 * @returns {Object} node to be used as an old node
 */
function executeCreate(node) {
	const nodeType = node.type;
	const nodeName = node.name;
	const nodeData = {};
	const nodeChildren = [];
	let nodeNode;

	if (nodeType === types.element) {
		nodeNode = document.createElement(node.name);

		// Set data and attributes.
		const data = node.data;

		for (let key in data) {
			const value = data[key];

			if (key !== "children") {
				nodeData[key] = value;
				nodeNode.setAttribute(key, value);
			}
		}

		// Recursively append children.
		const children = data.children;

		for (let i = 0; i < children.length; i++) {
			const child = executeCreate(children[i]);

			nodeChildren.push(child);
			nodeNode.appendChild(child.node);
		}
	} else {
		// Get text content using the default data key.
		const textContent = node.data[""];

		// Create a text node using the text content.
		nodeNode = document.createTextNode(textContent);

		// Set only the default data key.
		nodeData[""] = textContent;
	}

	// Set the children of the new old node.
	nodeData.children = nodeChildren;

	// Return a new node with copied properties of the original node. This is to
	// prevent bugs from hoisting. When the new nodes are compared to the old
	// ones, the old ones are modified, and the new ones are immutable.
	return {
		type: nodeType,
		name: nodeName,
		data: nodeData,
		node: nodeNode
	};
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
			// Execute the component to get the component view.
			const nodeComponent = components[node.name](node.data);

			// Set the root view or current node to the new component view.
			if (parent === null) {
				setViewNew(nodeComponent);
			} else {
				node = parent.data.children[index] = nodeComponent;
			}
		} else if (parent === null) {
			// If there is no parent, set the root new view to the current node.
			setViewNew(node);
		}

		// Execute the views of the children.
		const children = node.data.children;

		for (let i = 0; i < children.length; i++) {
			nodes.push(children[i]);
			parents.push(node);
			indexes.push(i);
		}

		if (nodes.length === 0) {
			// Move to the diff phase if there is nothing left to do.
			executeDiff([viewOld], [viewNew], []);

			break;
		} else if (performance.now() - executeStart >= 8) {
			// If the current frame doesn't have sufficient time left to keep
			// running then continue executing the view in the next frame.
			executeNext(() => {
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
 * @param {Array} nodesOld
 * @param {Array} nodesNew
 * @param {Array} patches
 */
function executeDiff(nodesOld, nodesNew, patches) {
	while (true) {
		const nodeOld = nodesOld.pop();
		const nodeNew = nodesNew.pop();

		if (nodeOld === nodeNew) {
			// If they have the same reference (hoisted) then skip diffing.
			continue;
		} else if (nodeOld.name !== nodeNew.name) {
			// If they have different names, then replace the old node with the
			// new one.
			patches.push({
				type: patchTypes.replaceElement,
				nodeOld: nodeOld,
				nodeNew: nodeNew,
				nodeParent: null
			});
		} else if (nodeOld.type === types.text) {
			// If they both are text, then update the text content.
			patches.push({
				type: patchTypes.updateText,
				nodeOld: nodeOld,
				nodeNew: nodeNew,
				parent: null
			});
		} else {
			// If they both are normal elements, then set attributes and diff the
			// children for appends, deletes, or recursive updates.
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
			// Move to the patch phase if there is nothing left to do.
			executePatch(patches);

			break;
		} else if (performance.now() - executeStart >= 8) {
			// If the current frame doesn't have sufficient time left to keep
			// running then continue diffing in the next frame.
			executeNext(() => {
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
			case patchTypes.updateText: {
				// Update text of a node with new text.
				const nodeOld = patch.nodeOld;
				const nodeNewText = patch.nodeNew.data[""];

				nodeOld.data[""] = nodeNewText;
				nodeOld.node.textContent = nodeNewText;

				break;
			}

			case patchTypes.setAttributes: {
				// Set attributes of a node with new data.
				const nodeOld = patch.nodeOld;
				const nodeOldData = nodeOld.data;
				const nodeOldNode = nodeOld.node;
				const nodeNewData = patch.nodeNew.data;

				// Mutate the old node with the new node's data and set attributes
				// on the DOM node.
				for (let key in nodeNewData) {
					const value = nodeNewData[key];

					if (key !== "children") {
						nodeOldData[key] = value;
						nodeOldNode.setAttribute(key, value);
					}
				}

				break;
			}

			case patchTypes.appendElement: {
				// Append a node. Creates a new old node because the old node must
				// be mutable while the new nodes are mutable.
				const nodeNew = patch.nodeNew;
				const nodeParent = patch.nodeParent;
				const nodeOldNew = executeCreate(nodeNew);

				nodeParent.data.children.push(nodeOldNew);
				nodeParent.node.appendChild(nodeOldNew.node);

				break;
			}

			case patchTypes.removeElement: {
				// Remove a node from the parent.
				const nodeParent = patch.nodeParent;

				// Pops the last child because the patches still hold a reference
				// to them. The diff phase can only create this patch when there
				// are extra old children, and popping nodes off of the end is more
				// efficient than removing at a specific index, especially because
				// they are equivalent in this case.
				nodeParent.data.children.pop();
				nodeParent.node.removeChild(patch.nodeOld);

				break;
			}

			case patchTypes.replaceElement: {
				// Replaces an old node with a new node.
				const nodeOld = patch.nodeOld;
				const nodeNew = patch.nodeNew;
				const nodeOldNew = executeCreate(nodeNew);
				const nodeOldNode = nodeOld.node;

				// Mutate the old node with the copied data from creating the new
				// old node, replacing the old DOM node reference.
				nodeOld.type = nodeOldNew.type;
				nodeOld.name = nodeOldNew.name;
				nodeOld.data = nodeOldNew.data;
				nodeOld.node = nodeOldNew.node;

				// Replace the old node using the reference created before updating
				// the old node.
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
	// Cancel any function scheduled to run in the next frame.
	executeCancel();

	// Record the current time to reference when running different functions.
	executeStart = performance.now();

	// Begin executing the view.
	executeView([viewCurrent(data)], [null], [0]);
}
