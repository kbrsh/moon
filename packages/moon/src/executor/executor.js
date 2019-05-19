import { components, data, setViewNew, viewCurrent, viewNew, viewOld } from "../util/globals";
import { types } from "../util/util";

/**
 * Start time
 */
let executeStart;

/**
 * Execution queue
 */
let executeQueue = [];

/**
 * Types of patches
 */
const patchTypes = {
	updateText: 0,
	updateData: 1,
	appendNode: 2,
	removeNode: 3,
	replaceNode: 4
};

/**
 * Creates an old reference node from a view node.
 *
 * @param {Object} node
 * @returns {Object} node to be used as an old node
 */
function executeCreate(node) {
	let element;
	let children = [];

	if (node.type === types.text) {
		// Create a text node using the text content from the default key.
		element = document.createTextNode(node.data[""]);
	} else {
		const nodeData = node.data;

		// Create a DOM element.
		element = document.createElement(node.name);

		// Set data, events, and attributes.
		for (let key in nodeData) {
			const value = nodeData[key];

			if (key[0] === "@") {
				let MoonEvents = element.MoonEvents;

				if (MoonEvents === undefined) {
					MoonEvents = element.MoonEvents = {
						[key]: value
					};
				} else {
					MoonEvents[key] = value;
				}

				element.addEventListener(key.slice(1), ($event) => {
					MoonEvents[key]($event);
				});
			} else if (key !== "children" && value !== false) {
				element.setAttribute(key, value);
			}
		}

		// Recursively append children.
		const nodeDataChildren = nodeData.children;

		for (let i = 0; i < nodeDataChildren.length; i++) {
			const childOld = executeCreate(nodeDataChildren[i]);

			element.appendChild(childOld.element);
			children.push(childOld);
		}
	}

	// Return an old node with a reference to the immutable node and mutable
	// element. This is to help performance and allow static nodes to be reused.
	return {
		element,
		node,
		children
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
			node = components[node.name](node.data);

			// Set the root view or current node to the new component view.
			if (parent === null) {
				setViewNew(node);
			} else {
				parent.data.children[index] = node;
			}
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
		} else if (performance.now() - executeStart >= 16) {
			// If the current frame doesn't have sufficient time left to keep
			// running then continue executing the view in the next frame.
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
 * @param {Array} nodesOld
 * @param {Array} nodesNew
 * @param {Array} patches
 */
function executeDiff(nodesOld, nodesNew, patches) {
	while (true) {
		const nodeOld = nodesOld.pop();
		const nodeOldNode = nodeOld.node;
		const nodeNew = nodesNew.pop();

		// If they have the same reference (hoisted) then skip diffing.
		if (nodeOldNode !== nodeNew) {
			if (nodeOldNode.name !== nodeNew.name) {
				// If they have different names, then replace the old node with the
				// new one.
				patches.push({
					type: patchTypes.replaceNode,
					nodeOld,
					nodeNew,
					nodeParent: null
				});
			} else if (nodeOldNode.type === types.text) {
				// If they both are text, then update the text content.
				if (nodeOldNode.data[""] !== nodeNew.data[""]) {
					patches.push({
						type: patchTypes.updateText,
						nodeOld,
						nodeNew,
						nodeParent: null
					});
				}
			} else {
				// If they both are normal elements, then update attributes, update
				// events, and diff the children for appends, deletes, or recursive
				// updates.
				patches.push({
					type: patchTypes.updateData,
					nodeOld,
					nodeNew,
					nodeParent: null
				});

				const childrenOld = nodeOld.children;
				const childrenNew = nodeNew.data.children;

				const childrenOldLength = childrenOld.length;
				const childrenNewLength = childrenNew.length;

				if (childrenOldLength === childrenNewLength) {
					// If the children have the same length then update both as
					// usual.
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
							type: patchTypes.removeNode,
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
							type: patchTypes.appendNode,
							nodeOld: null,
							nodeNew: childrenNew[i],
							nodeParent: nodeOld
						});
					}
				}
			}
		}

		if (nodesOld.length === 0) {
			// Move to the patch phase if there is nothing left to do.
			executePatch(patches);

			break;
		} else if (performance.now() - executeStart >= 16) {
			// If the current frame doesn't have sufficient time left to keep
			// running then continue diffing in the next frame.
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
			case patchTypes.updateText: {
				// Update text of a node with new text.
				const nodeOld = patch.nodeOld;
				const nodeNew = patch.nodeNew;

				nodeOld.element.data = nodeNew.data[""];
				nodeOld.node = nodeNew;

				break;
			}

			case patchTypes.updateData: {
				// Set attributes and events of a node with new data.
				const nodeOld = patch.nodeOld;
				const nodeOldNodeData = nodeOld.node.data;
				const nodeOldElement = nodeOld.element;
				const nodeNew = patch.nodeNew;
				const nodeNewData = nodeNew.data;

				// Set attributes on the DOM element.
				for (let key in nodeNewData) {
					const value = nodeNewData[key];

					if (key[0] === "@") {
						// Update the event listener.
						nodeOldElement.MoonEvents[key] = value;
					} else if (key !== "children") {
						// Remove the attribute if the value is false, and update it
						// otherwise.
						if (value === false) {
							nodeOldElement.removeAttribute(key);
						} else {
							nodeOldElement.setAttribute(key, value);
						}
					}
				}

				// Remove old attributes.
				for (let key in nodeOldNodeData) {
					if (!(key in nodeNewData)) {
						nodeOldElement.removeAttribute(key);
					}
				}

				nodeOld.node = nodeNew;

				break;
			}

			case patchTypes.appendNode: {
				// Append a node to the parent.
				const nodeParent = patch.nodeParent;
				const nodeOldNew = executeCreate(patch.nodeNew);

				nodeParent.element.appendChild(nodeOldNew.element);
				nodeParent.children.push(nodeOldNew);

				break;
			}

			case patchTypes.removeNode: {
				// Remove a node from the parent.
				const nodeParent = patch.nodeParent;

				// Pops the last child because the patches still hold a reference
				// to them. The diff phase can only create this patch when there
				// are extra old children, and popping nodes off of the end is more
				// efficient than removing at a specific index, especially because
				// they are equivalent in this case.
				nodeParent.element.removeChild(nodeParent.children.pop().element);

				break;
			}

			case patchTypes.replaceNode: {
				// Replaces an old node with a new node.
				const nodeOld = patch.nodeOld;
				const nodeOldElement = nodeOld.element;
				const nodeNew = patch.nodeNew;
				const nodeOldNew = executeCreate(nodeNew);
				const nodeOldNewElement = nodeOldNew.element;

				nodeOldElement.parentNode.replaceChild(nodeOldNewElement, nodeOldElement);

				nodeOld.element = nodeOldNewElement;
				nodeOld.node = nodeOldNew.node;
				nodeOld.children = nodeOldNew.children;

				break;
			}
		}
	}

	// Remove the current execution from the queue.
	executeQueue.shift();

	// If there is new data in the execution queue, continue to it.
	if (executeQueue.length !== 0) {
		if (performance.now() - executeStart >= 16) {
			// If the current frame doesn't have sufficient time left to keep
			// running then start the next execution in the next frame.
			requestAnimationFrame(() => {
				executeStart = performance.now();

				executeNext();
			});
		} else {
			executeNext();
		}
	}
}

/**
 * Execute the next update in the execution queue.
 */
function executeNext() {
	// Get the next data update.
	const dataNew = executeQueue[0];

	// Merge new data into current data.
	for (let key in dataNew) {
		data[key] = dataNew[key];
	}

	// Begin executing the view.
	const viewNew = viewCurrent(data);

	setViewNew(viewNew);
	executeView([viewNew], [null], [0]);
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
 *
 * @param {Object} dataNew
 */
export function execute(dataNew) {
	// Push the new data to the execution queue.
	executeQueue.push(dataNew);

	// Execute the next function in the queue if none are scheduled yet.
	if (executeQueue.length === 1) {
		requestAnimationFrame(() => {
			executeStart = performance.now();

			executeNext();
		});
	}
}
