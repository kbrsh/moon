import { instructions } from "./instructions/instruction";

/**
 * Gets a value from the executor data given a variable index.
 *
 * @param {number} index
 * @param {Object} data
 * @returns Value from data
 */
function executeGet(index, data) {
	return data[`m${index}`];
}

/**
 * Sets a value from the executor data given a variable index.
 *
 * @param {number} index
 * @param value
 * @param {Object} data
 * @returns Value from data
 */
function executeSet(index, value, data) {
	data[`m${index}`] = value;
}

/**
 * Executor
 *
 * The executor is responsible for executing instructions passed to it. It
 * starts at the given start index and calls the `next` callback when it's
 * done. It runs the instructions over multiple frames to allow the browser to
 * handle other high-priority events.
 *
 * @param {number} start
 * @param {string} code
 * @param {Function} next
 */
export function execute(start, data, code, next) {
	main:
	for (let i = start; i < code.length;) {
		switch (code.charCodeAt(i)) {
			case instructions.createElement: {
				const storage = code.charCodeAt(++i);
				const element = document.createElement(executeGet(code.charCodeAt(++i), data));
				const attributes = executeGet(code.charCodeAt(++i), data);

				for (let attribute in attributes) {
					element.setAttribute(attribute, attributes[attribute]);
				}

				executeSet(
					storage,
					element,
					data
				);

				i += 1;
				break;
			}

			case instructions.updateElement: {
				const element = executeGet(code.charCodeAt(++i), data);
				const attributes = executeGet(code.charCodeAt(++i), data);

				for (let attribute in attributes) {
					element.setAttribute(attribute, attributes[attribute]);
				}

				i += 1;
				break;
			}

			case instructions.createText: {
				executeSet(
					code.charCodeAt(++i),
					document.createTextNode(executeGet(code.charCodeAt(++i), data)),
					data
				);

				i += 1;
				break;
			}

			case instructions.updateText: {
				const text = executeGet(code.charCodeAt(++i), data);
				const content = executeGet(code.charCodeAt(++i), data);

				text.textContent = content;

				i += 1;
				break;
			}

			case instructions.destroyElement: {
				const element = executeGet(code.charCodeAt(++i), data);

				element.parentNode.destroyChild(element);

				i += 1;
				break;
			}

			case instructions.appendElement: {
				const element = executeGet(code.charCodeAt(++i), data);
				const parent = executeGet(code.charCodeAt(++i), data);

				parent.appendChild(element);

				i += 1;
				break;
			}

			case instructions.returnVar: {
				next(executeGet(code.charCodeAt(++i), data));
				break;
			}
		}
	}
}
