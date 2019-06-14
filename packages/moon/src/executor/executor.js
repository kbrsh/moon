import { setEvent, updateAttributeSet, removeAttributeSet } from "./util/util";
import { components, md, mc, ms, viewNew, viewOld, setViewNew } from "../util/globals";
import { m, NodeOld, types } from "../util/util";

/**
 * Start time
 */
let executeStart;

/**
 * Execution queue
 */
let executeQueue = [];

/**
 * Moon DOM node
 */
Node.prototype.MoonEvents = null;
Node.prototype.MoonListeners = null;

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
		// Create a DOM element.
		element = document.createElement(node.name);

		// Recursively append children.
		const nodeChildren = node.children;

		for (let i = 0; i < nodeChildren.length; i++) {
			const childOld = executeCreate(nodeChildren[i]);

			element.appendChild(childOld.element);
			children.push(childOld);
		}

		// Store DOM events.
		const MoonEvents = element.MoonEvents = {};
		const MoonListeners = element.MoonListeners = {};

		// Set data.
		const nodeData = node.data;

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
 * Executes a view, including all components.
 *
 * @param {Array} nodes
 */
function executeView(nodes) {
	while (true) {
		const node = nodes.pop();
		let nodeChildren = node.children;

		while (node.type === types.component) {
			// Execute the component to get the component view.
			const nodeName = node.name;
			const nodeComponent = components[nodeName](
				m,
				node.data,
				nodeChildren,
				ms[nodeName]
			);

			// Update the node to reflect the component view.
			node.type = nodeComponent.type;
			node.name = nodeComponent.name;
			node.data = nodeComponent.data;
			nodeChildren = node.children = nodeComponent.children;
		}

		// Execute the views of the children.
		const nodeChildrenLength = nodeChildren.length;

		if (nodeChildrenLength !== 0) {
			for (let i = 0; i < nodeChildrenLength; i++) {
				nodes.push(nodeChildren[i]);
			}
		}

		if (nodes.length === 0) {
			// Move to the patch phase if there is nothing left to do.
			executePatch(viewOld, viewNew);

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

				executeView(nodes);
			});

			break;
		}
	}
}

/**
 * Transforms an old node into a new one, making changes to the DOM as needed.
 *
 * @param {Object} nodeOld
 * @param {Object} nodeNew
 */
function executePatch(nodeOld, nodeNew) {
	const nodeOldNode = nodeOld.node;

	if (nodeOldNode !== nodeNew) {
		// Update the old node reference. This doesn't affect the rest of the
		// patch because it uses `nodeOldNode` instead of direct property access.
		nodeOld.node = nodeNew;

		if (
			nodeOldNode.type !== nodeNew.type ||
			nodeOldNode.name !== nodeNew.name
		) {
			// If the types or name aren't the same, then replace the old node
			// with the new one.
			const nodeOldElement = nodeOld.element;
			const nodeOldNew = executeCreate(nodeNew);
			const nodeOldNewElement = nodeOldNew.element;

			nodeOld.element = nodeOldNewElement;
			nodeOld.children = nodeOldNew.children;

			nodeOldElement.parentNode.replaceChild(
				nodeOldElement,
				nodeOldNewElement
			);
		} else if (nodeOldNode.type === types.text) {
			// If they both are text, then update the text content.
			const nodeNewText = nodeNew.data[""];

			if (nodeOldNode.data[""] !== nodeNewText) {
				nodeOld.element.data = nodeNewText;
			}
		} else {
			// If they are both elements, then update the data.
			const nodeOldElement = nodeOld.element;
			const nodeOldNodeData = nodeOldNode.data;
			const nodeNewData = nodeNew.data;

			if (nodeOldNodeData !== nodeNewData) {
				// First, go through all new data and update all of the existing data
				// to match.
				for (let keyNew in nodeNewData) {
					const valueOld = nodeOldNodeData[keyNew];
					const valueNew = nodeNewData[keyNew];

					if (valueOld !== valueNew) {
						if (keyNew.charCodeAt(0) === 64) {
							// Update an event.
							const MoonEvents = nodeOldElement.MoonEvents;

							if (MoonEvents[keyNew] === undefined) {
								// If the event doesn't exist, add a new event listener.
								setEvent(
									keyNew,
									valueNew,
									MoonEvents,
									nodeOldElement.MoonListeners,
									nodeOldElement
								);
							} else {
								// If it does exist, update the existing event handler.
								MoonEvents[keyNew] = valueNew;
							}
						} else if (
							keyNew === "ariaset" ||
							keyNew === "dataset" ||
							keyNew === "style"
						) {
							// If it is a set attribute, update all values in the set.
							updateAttributeSet(keyNew, valueNew, nodeOldElement);

							if (valueOld !== undefined) {
								// If there was an old set, remove all old set attributes
								// while excluding any new ones that still exist.
								removeAttributeSet(keyNew, valueOld, valueNew, nodeOldElement);
							}
						} else {
							// Update a DOM property.
							nodeOldElement[keyNew] = valueNew;
						}
					}
				}

				// Next, go through all of the old data and remove data that isn't in
				// the new data.
				for (let keyOld in nodeOldNodeData) {
					if (!(keyOld in nodeNewData)) {
						if (keyOld.charCodeAt(0) === 64) {
							// Remove an event.
							const MoonListeners = nodeOldElement.MoonListeners;

							// Remove the event listener from the DOM.
							nodeOldElement.removeEventListener(MoonListeners[keyOld]);

							// Remove both the event listener and event handler.
							MoonListeners[keyOld] = undefined;
							nodeOldElement.MoonEvents[keyOld] = undefined;
						} else if (
							keyOld === "ariaset" ||
							keyOld === "dataset" ||
							keyOld === "style"
						) {
							// If it is a set attribute, remove all old values from the
							// set and exclude nothing.
							removeAttributeSet(keyOld, nodeOldNodeData[keyOld], {}, nodeOldElement);
						} else {
							// Remove a DOM property.
							nodeOldElement.removeAttribute(keyOld);
						}
					}
				}
			}

			// Recursively patch children.
			const childrenOld = nodeOld.children;
			const childrenNew = nodeNew.children;

			if (childrenOld !== childrenNew) {
				const childrenOldLength = childrenOld.length;
				const childrenNewLength = childrenNew.length;

				if (childrenOldLength === childrenNewLength) {
					// If the children have the same length then update both as
					// usual.
					for (let i = 0; i < childrenOldLength; i++) {
						executePatch(childrenOld[i], childrenNew[i]);
					}
				} else if (childrenOldLength > childrenNewLength) {
					// If there are more old children than new children, update the
					// corresponding ones and remove the extra old children.
					for (let i = 0; i < childrenNewLength; i++) {
						executePatch(childrenOld[i], childrenNew[i]);
					}

					for (let i = childrenNewLength; i < childrenOldLength; i++) {
						nodeOldElement.removeChild(childrenOld.pop().element);
					}
				} else {
					// If there are more new children than old children, update the
					// corresponding ones and append the extra new children.
					for (let i = 0; i < childrenOldLength; i++) {
						executePatch(childrenOld[i], childrenNew[i]);
					}

					for (let i = childrenOldLength; i < childrenNewLength; i++) {
						const nodeOldNew = executeCreate(childrenNew[i]);

						childrenOld.push(nodeOldNew);
						nodeOldElement.appendChild(nodeOldNew.element);
					}
				}
			}
		}
	}
}

/**
 * Execute the next update in the execution queue.
 */
function executeNext() {
	// Store new data.
	const dataNew = executeQueue.shift();

	// Merge new data into current data.
	for (let key in dataNew) {
		md[key] = dataNew[key];
	}

	// Begin the view phase.
	setViewNew(components.Root(m, md, mc, ms.Root));
	executeView([viewNew]);
}

/**
 * Executor
 *
 * The executor runs in two phases.
 *
 * 1. View
 * 2. Patch
 *
 * The view phase consists of walking the new tree and executing components.
 * This is run over multiple frames because big view trees can take a while to
 * generate, and the user can provide input to create various events during
 * this render. Instead of freezing up the browser, Moon allows events to be
 * handled in between frames while the view is rendering.
 *
 * The patch phase consists of transforming the old tree into the new view
 * tree. Differences between nodes are found, and their equivalent DOM
 * operations are performed to update the DOM. At the same time, the old view
 * tree is updated to match the new one without mutating the new tree. This
 * allows for a quick reference check to skip over a patch. This phase is run
 * over one frame to prevent an inconsistent UI -- similar to screen tearing.
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
