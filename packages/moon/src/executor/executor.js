import { setEvent, updateAttributeSet, removeAttributeSet } from "./util/util";
import { components, data, viewCurrent, viewOld } from "../util/globals";
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
	updateNode: 1,
	updateDataEvent: 2,
	updateDataSet: 3,
	updateDataProperty: 4,
	removeDataEvent: 5,
	removeDataSet: 6,
	removeDataSetExclude: 7,
	removeDataProperty: 8,
	appendNode: 9,
	removeNode: 10,
	replaceNode: 11
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

		// Recursively append children.
		const nodeDataChildren = nodeData.children;

		for (let i = 0; i < nodeDataChildren.length; i++) {
			const childOld = executeCreate(nodeDataChildren[i]);

			element.appendChild(childOld.element);
			children.push(childOld);
		}

		// Store DOM events.
		const MoonEvents = element.MoonEvents = {};
		const MoonListeners = element.MoonListeners = {};

		// Set data, events, and attributes.
		for (let key in nodeData) {
			const value = nodeData[key];

			if (key.charCodeAt(0) === 64) {
				// Set an event listener.
				setEvent(key, value, MoonEvents, MoonListeners, element);
			} else if (
				key === "ariaset" ||
				key === "dataset" ||
				key === "style"
			) {
				// Set aria-*, data-*, and style attributes.
				updateAttributeSet(key, value, element);
			} else if (key !== "children") {
				// Set an attribute.
				element[key] = value;
			}
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
 * Executes a component until it returns a usable node.
 *
 * @param {Object} node
 * @returns {Object} executed component node
 */
function executeComponent(node) {
	while (node.type === types.component) {
		node = components[node.name](node.data);
	}

	return node;
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
		const nodeNew = executeComponent(nodesNew.pop());

		// If they have the same reference (hoisted) then skip diffing.
		if (nodeOldNode !== nodeNew) {
			if (
				nodeOldNode.type !== nodeNew.type ||
				nodeOldNode.name !== nodeNew.name
			) {
				// If they have different types or names, then replace the old node
				// with the new one.
				patches.push({
					type: patchTypes.replaceNode,
					nodeOld,
					nodeOldNew: executeCreate(nodeNew)
				});
			} else if (nodeOldNode.type === types.text) {
				// If they both are text, then update the text content.
				const nodeNewText = nodeNew.data[""];

				if (nodeOldNode.data[""] !== nodeNewText) {
					patches.push({
						type: patchTypes.updateText,
						nodeOld,
						nodeNew,
						nodeNewText
					});
				}
			} else {
				// If they both are normal elements, then update attributes, update
				// events, and diff the children for appends, deletes, or recursive
				// updates.

				// Push a patch to change the node reference on the old node.
				patches.push({
					type: patchTypes.updateNode,
					nodeOld,
					nodeNew
				});

				// Diff data.
				const nodeOldElement = nodeOld.element;
				const nodeOldNodeData = nodeOldNode.data;
				const nodeNewData = nodeNew.data;

				for (let keyNew in nodeNewData) {
					const valueOld = nodeOldNodeData[keyNew];
					const valueNew = nodeNewData[keyNew];

					if (valueOld !== valueNew && keyNew !== "children") {
						let type;

						if (keyNew.charCodeAt(0) === 64) {
							type = patchTypes.updateDataEvent;
						} else if (
							keyNew === "ariaset" ||
							keyNew === "dataset" ||
							keyNew === "style"
						) {
							type = patchTypes.updateDataSet;

							if (valueOld !== undefined) {
								patches.push({
									type: patchTypes.removeDataSetExclude,
									keyNew,
									valueOld,
									valueNew,
									nodeOldElement
								});
							}
						} else {
							type = patchTypes.updateDataProperty;
						}

						patches.push({
							type,
							keyNew,
							valueNew,
							nodeOldElement
						});
					}
				}

				for (let keyOld in nodeOldNodeData) {
					if (!(keyOld in nodeNewData)) {
						let type;

						if (keyOld.charCodeAt(0) === 64) {
							type = patchTypes.removeDataEvent;
						} else if (
							keyOld === "ariaset" ||
							keyOld === "dataset" ||
							keyOld === "style"
						) {
							type = patchTypes.removeDataSet;
						} else {
							type = patchTypes.removeDataProperty;
						}

						patches.push({
							type,
							keyOld,
							valueOld: nodeOldNodeData[keyOld],
							nodeOldElement
						});
					}
				}

				const childrenOld = nodeOld.children;
				const childrenNew = nodeNewData.children;

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
							nodeOldNew: executeCreate(executeComponent(childrenNew[i])),
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

				nodeOld.element.data = patch.nodeNewText;
				nodeOld.node = patch.nodeNew;

				break;
			}

			case patchTypes.updateNode: {
				// Update the reference of an old node.
				patch.nodeOld.node = patch.nodeNew;

				break;
			}

			case patchTypes.updateDataEvent: {
				// Update an event.
				const keyNew = patch.keyNew;
				const nodeOldElement = patch.nodeOldElement;
				const MoonEvents = nodeOldElement.MoonEvents;

				if (MoonEvents[keyNew] === undefined) {
					setEvent(
						keyNew,
						patch.valueNew,
						MoonEvents,
						nodeOldElement.MoonListeners,
						nodeOldElement
					);
				} else {
					MoonEvents[keyNew] = patch.valueNew;
				}

				break;
			}

			case patchTypes.updateDataSet: {
				// Update a set attribute.
				updateAttributeSet(patch.keyNew, patch.valueNew, patch.nodeOldElement);

				break;
			}

			case patchTypes.updateDataProperty: {
				// Update a DOM property.
				patch.nodeOldElement[patch.keyNew] = patch.valueNew;

				break;
			}

			case patchTypes.removeDataEvent: {
				// Remove an event.
				const keyOld = patch.keyOld;
				const nodeOldElement = patch.nodeOldElement;
				const MoonListeners = nodeOldElement.MoonListeners;

				nodeOldElement.removeEventListener(MoonListeners[keyOld]);

				delete nodeOldElement.MoonEvents[keyOld];
				delete MoonListeners[keyOld];

				break;
			}

			case patchTypes.removeDataSet: {
				// Remove a set property.
				removeAttributeSet(patch.keyOld, patch.valueOld, {}, patch.nodeOldElement);

				break;
			}

			case patchTypes.removeDataSetExclude: {
				// Remove a set property while excluding new values.
				removeAttributeSet(patch.keyOld, patch.valueOld, patch.valueNew, patch.nodeOldElement);

				break;
			}

			case patchTypes.removeDataProperty: {
				// Remove a DOM property.
				patch.nodeOldElement.removeAttribute(patch.keyOld);

				break;
			}

			case patchTypes.appendNode: {
				// Append a node to the parent.
				const nodeParent = patch.nodeParent;
				const nodeOldNew = patch.nodeOldNew;

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
				const nodeOldNew = patch.nodeOldNew;
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

	// Begin the diff phase.
	executeDiff([viewOld], [viewCurrent(data)], []);
}

/**
 * Executor
 *
 * The executor runs in two phases.
 *
 * 1. Diff
 * 2. Patch
 *
 * The diff phase consists of walking the old and new tree while finding
 * differences. The differences are pushed as individual patches to a global
 * list of them. Components are also executed in this phase. This is run over
 * multiple frames because finding differences between large component trees
 * can take a while, especially from long lists.
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
