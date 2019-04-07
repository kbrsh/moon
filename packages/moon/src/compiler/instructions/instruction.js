/**
 * Set of instructions that the compiler can output.
 */
export const instructions = {
	createElement: 0, // storage, type, attributes
	updateElement: 1, // element, attributes

	createText: 2, // storage, content
	updateText: 3, // element, content

	destroyElement: 4, // element
	appendElement: 5, // element, parent element

	createComponent: 6, // storage, component name, data
	updateComponent: 7, // component instance, data
	destroyComponent: 8, // component instance

	returnVar: 9 // var
};

/**
 * Returns an instruction from the given type and arguments.
 */
export function instruction(type, args) {
	let code = String.fromCharCode(type);

	for (let i = 0; i < args.length; i++) {
		code += String.fromCharCode(args[i]);
	}

	return code;
}
