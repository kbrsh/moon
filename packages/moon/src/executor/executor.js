import { updateDataSet, removeDataProperty, removeDataSet } from "./util/util";
import { components, md, mc, ms, viewOld } from "../util/globals";
import { m, NodeOld, types } from "../util/util";

/**
 * Start time
 */
let executeStart;

/**
 * Execution queue
 */
const executeQueue = [];

/**
 * Patch types
 */
const patchTypes = {
	appendNode: 0,
	removeNode: 1,
	replaceNode: 2,
	setDataEvent: 3,
	updateDataProperty: 4,
	updateDataText: 5,
	updateDataEvent: 6,
	updateDataSet: 7,
	removeDataProperty: 8,
	removeDataEvent: 9,
	removeDataSet: 10
};

/**
 * Moon event
 *
 * This is used as a global event handler for any event type, and it calls the
 * corresponding handler with the event, data, and children.
 */
function MoonEvent() {}

MoonEvent.prototype.handleEvent = function(event) {
	const info = this["@" + event.type];
	info[0](event, info[1], info[2]);
};

Node.prototype.MoonEvent = null;

/**
 * Executes a component and modifies it to be the result of the component view.
 *
 * @param {Object} node
 */
function executeComponent(node) {
	while (node.type === types.component) {
		// Execute the component to get the component view.
		const nodeName = node.name;
		const nodeComponent = components[nodeName](
			m,
			node.data,
			node.children,
			ms[nodeName]
		);

		// Update the node to reflect the component view.
		node.type = nodeComponent.type;
		node.name = nodeComponent.name;
		node.data = nodeComponent.data;
		node.children = nodeComponent.children;
	}
}

/**
 * Creates an old reference node from a view node.
 *
 * @param {Object} node
 * @returns {Object} node to be used as an old node
 */
function executeCreate(node) {
	const children = [];
	let element;

	if (node.type === types.text) {
		// Create a text node using the text content from the default key.
		element = document.createTextNode(node.data[""]);
	} else {
		// Create a DOM element.
		element = document.createElement(node.name);

		// Recursively append children.
		const nodeChildren = node.children;

		for (let i = 0; i < nodeChildren.length; i++) {
			const childNew = nodeChildren[i];

			executeComponent(childNew);

			const childOld = executeCreate(childNew);

			children.push(childOld);
			element.appendChild(childOld.element);
		}

		// Set data.
		const nodeData = node.data;

		for (const key in nodeData) {
			const value = nodeData[key];

			if (key.charCodeAt(0) === 64) {
				// Set an event listener.
				let elementMoonEvent = element.MoonEvent;

				if (elementMoonEvent === null) {
					elementMoonEvent = element.MoonEvent = new MoonEvent();
				}

				elementMoonEvent[key] = value;
				element.addEventListener(key.slice(1), elementMoonEvent);
			} else if (
				key === "ariaset" ||
				key === "dataset" ||
				key === "style"
			) {
				// Set aria-*, data-*, and style attributes.
				updateDataSet(element, key, value);
			} else {
				// Set an attribute.
				element[key] = value;
			}
		}
	}

	// Return an old node with a reference to the immutable node and mutable
	// element. This is to help performance and allow static nodes to be reused.
	return new NodeOld(node, element, children);
}

/**
 * Executes a view and finds differences between nodes.
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

		// Execute any potential components.
		executeComponent(nodeNew);

		if (nodeOldNode !== nodeNew) {
			const nodeOldNodeType = nodeOldNode.type;
			const nodeOldNodeName = nodeOldNode.name;

			// Update the old node reference. This doesn't affect the rest of the
			// patch because it uses `nodeOldNode` instead of direct property access.
			nodeOld.node = nodeNew;

			if (
				nodeOldNodeType !== nodeNew.type ||
				nodeOldNodeName !== nodeNew.name
			) {
				// If the types or name aren't the same, then replace the old node
				// with the new one.
				const nodeOldElement = nodeOld.element;
				const nodeOldNew = executeCreate(nodeNew);
				const nodeOldNewElement = nodeOldNew.element;

				nodeOld.element = nodeOldNewElement;
				nodeOld.children = nodeOldNew.children;

				patches.push({
					type: patchTypes.replaceNode,
					elementOld: nodeOldElement,
					elementNew: nodeOldNewElement,
					elementParent: nodeOldElement.parentNode
				});
			} else if (nodeOldNodeType === types.text) {
				// If they both are text, then update the text content.
				const nodeNewText = nodeNew.data[""];

				if (nodeOldNode.data[""] !== nodeNewText) {
					patches.push({
						type: patchTypes.updateDataText,
						element: nodeOld.element,
						text: nodeNewText
					});
				}
			} else {
				// If they are both elements, then update the data.
				const nodeOldNodeData = nodeOldNode.data;
				const nodeNewData = nodeNew.data;

				if (nodeOldNodeData !== nodeNewData) {
					// First, go through all new data and update all of the existing data
					// to match.
					const nodeOldElement = nodeOld.element;

					for (const keyNew in nodeNewData) {
						const valueOld = nodeOldNodeData[keyNew];
						const valueNew = nodeNewData[keyNew];

						if (valueOld !== valueNew) {
							if (keyNew.charCodeAt(0) === 64) {
								// Update an event.
								let nodeOldElementMoonEvent = nodeOldElement.MoonEvent;

								if (nodeOldElementMoonEvent === null) {
									nodeOldElementMoonEvent = nodeOldElement.MoonEvent = new MoonEvent();
								}

								if (keyNew in nodeOldElementMoonEvent) {
									// If the event exists, update the existing event handler.
									patches.push({
										type: patchTypes.updateDataEvent,
										elementMoonEvent: nodeOldElementMoonEvent,
										key: keyNew,
										value: valueNew
									});
								} else {
									// If the event doesn't exist, add a new event listener.
									patches.push({
										type: patchTypes.setDataEvent,
										element: nodeOldElement,
										elementMoonEvent: nodeOldElementMoonEvent,
										key: keyNew,
										value: valueNew
									});
								}
							} else if (
								keyNew === "ariaset" ||
								keyNew === "dataset" ||
								keyNew === "style"
							) {
								// If it is a set attribute, update all values in the set.
								patches.push({
									type: patchTypes.updateDataSet,
									element: nodeOldElement,
									key: keyNew,
									value: valueNew
								});

								if (keyNew in nodeOldNodeData) {
									// If there was an old set, remove all old set attributes
									// while excluding any new ones that still exist.
									patches.push({
										type: patchTypes.removeDataSet,
										element: nodeOldElement,
										key: keyNew,
										value: valueOld,
										exclude: valueNew
									});
								}
							} else {
								// Update a DOM property.
								patches.push({
									type: patchTypes.updateDataProperty,
									element: nodeOldElement,
									key: keyNew,
									value: valueNew
								});
							}
						}
					}

					// Next, go through all of the old data and remove data that isn't in
					// the new data.
					for (const keyOld in nodeOldNodeData) {
						if (!(keyOld in nodeNewData)) {
							if (keyOld.charCodeAt(0) === 64) {
								// Remove an event.
								patches.push({
									type: patchTypes.removeDataEvent,
									element: nodeOldElement,
									elementMoonEvent: nodeOldElement.MoonEvent,
									key: keyOld
								});
							} else if (
								keyOld === "ariaset" ||
								keyOld === "dataset" ||
								keyOld === "style"
							) {
								// If it is a set attribute, remove all old values from the
								// set and exclude nothing.
								patches.push({
									type: patchTypes.removeDataSet,
									element: nodeOldElement,
									key: keyOld,
									value: nodeOldNodeData[keyOld],
									exclude: {}
								});
							} else {
								// Remove a DOM property.
								patches.push({
									type: patchTypes.removeDataProperty,
									element: nodeOldElement,
									name: nodeOldNodeName,
									key: keyOld
								});
							}
						}
					}
				}

				// Diff children.
				const childrenNew = nodeNew.children;

				if (nodeOldNode.children !== childrenNew) {
					const nodeOldElement = nodeOld.element;

					const childrenOld = nodeOld.children;
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
								element: childrenOld.pop().element,
								elementParent: nodeOldElement
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
							const childNew = childrenNew[i];

							executeComponent(childNew);

							const nodeOldNew = executeCreate(childNew);

							childrenOld.push(nodeOldNew);
							patches.push({
								type: patchTypes.appendNode,
								element: nodeOldNew.element,
								elementParent: nodeOldElement
							});
						}
					}
				}
			}
		}

		if (nodesOld.length === 0) {
			// Move to the patch phase if there is nothing left to do.
			executePatch(patches);

			// Remove the update from the queue.
			executeQueue.shift();

			// If there is new data in the execution queue, continue to it.
			if (executeQueue.length !== 0) {
				if (Date.now() - executeStart >= 16) {
					// If the current frame doesn't have sufficient time left to keep
					// running then start the next execution in the next frame.
					requestAnimationFrame(() => {
						executeStart = Date.now();

						executeNext();
					});
				} else {
					executeNext();
				}
			}

			break;
		} else if (Date.now() - executeStart >= 16) {
			// If the current frame doesn't have sufficient time left to keep
			// running then continue executing the view in the next frame.
			requestAnimationFrame(() => {
				executeStart = Date.now();

				executeDiff(nodesOld, nodesNew, patches);
			});

			break;
		}
	}
}

/**
 * Performs DOM patches.
 *
 * @param {Array} patches
 */
function executePatch(patches) {
	for (let i = 0; i < patches.length; i++) {
		const patch = patches[i];

		switch (patch.type) {
			case patchTypes.appendNode: {
				// Append an element.
				patch.elementParent.appendChild(patch.element);

				break;
			}

			case patchTypes.removeNode: {
				// Remove an element.
				patch.elementParent.removeChild(patch.element);

				break;
			}

			case patchTypes.replaceNode: {
				// Replace an old element with a new one.
				patch.elementParent.replaceChild(patch.elementNew, patch.elementOld);

				break;
			}

			case patchTypes.setDataEvent: {
				// Set an event listener.
				const elementMoonEvent = patch.elementMoonEvent;
				const key = patch.key;

				elementMoonEvent[key] = patch.value;
				patch.element.addEventListener(key.slice(1), elementMoonEvent);

				break;
			}

			case patchTypes.updateDataProperty: {
				// Update a DOM property.
				patch.element[patch.key] = patch.value;

				break;
			}

			case patchTypes.updateDataText: {
				// Update text.
				patch.element.data = patch.text;

				break;
			}

			case patchTypes.updateDataEvent: {
				// Update an event listener.
				patch.elementMoonEvent[patch.key] = patch.value;

				break;
			}

			case patchTypes.updateDataSet: {
				// Update an attribute set.
				updateDataSet(patch.element, patch.key, patch.value);

				break;
			}

			case patchTypes.removeDataProperty: {
				// Remove a DOM property.
				removeDataProperty(patch.element, patch.name, patch.key);

				break;
			}

			case patchTypes.removeDataEvent: {
				// Remove an event listener.
				const elementMoonEvent = patch.elementMoonEvent;
				const key = patch.key;

				delete elementMoonEvent[key];
				patch.element.removeEventListener(key.slice(1), elementMoonEvent);

				break;
			}

			case patchTypes.removeDataSet: {
				// Remove an attribute set.
				removeDataSet(patch.element, patch.key, patch.value, patch.exclude);

				break;
			}
		}
	}
}

/**
 * Execute the next update in the execution queue.
 */
function executeNext() {
	// Store new data.
	const dataNew = executeQueue[0];

	// Merge new data into current data.
	for (const key in dataNew) {
		md[key] = dataNew[key];
	}

	// Begin the view phase.
	executeDiff([viewOld], [components.Root(m, md, mc, ms.Root)], []);
}

/**
 * Executor
 *
 * The executor runs in two phases.
 *
 * 1. Diff
 * 2. Patch
 *
 * The diff phase consists of walking the new tree and executing components and
 * finding differences between the trees. At the same time, the old tree is
 * changed to include references to the new one. This is run over multiple
 * frames because big view trees can take a while to generate, and the user can
 * provide input to create various events during this render. Instead of
 * freezing up the browser, Moon allows events to be handled in between frames
 * while the view is rendering.
 *
 * The patch phase consists of transforming the old tree into the new view
 * tree. DOM operations from the previous phase are performed to update the
 * DOM. This allows for a quick reference check to skip over a patch. This
 * phase is run over one frame to prevent an inconsistent UI -- similar to
 * screen tearing.
 *
 * @param {Object} dataNew
 */
export function execute(dataNew) {
	// Push the new data to the execution queue.
	executeQueue.push(dataNew);

	// Execute the next function in the queue if none are scheduled yet.
	if (executeQueue.length === 1) {
		requestAnimationFrame(() => {
			executeStart = Date.now();

			executeNext();
		});
	}
}
