/**
 * Set of instructions that the compiler can output.
 */
export const instructions = {
	createElement: 0 | (3 << 4), // storage, type, attributes
	updateElement: 1 | (2 << 4), // element, attributes

	createText: 2 | (2 << 4), // storage, content
	updateText: 3 | (2 << 4), // element, content

	destroyElement: 4 | (1 << 4), // element
	appendElement: 5 | (2 << 4), // element, parent element

	createComponent: 6 | (3 << 4), // storage, component name, data
	updateComponent: 7 | (2 << 4), // component instance, data
	destroyComponent: 8 | (1 << 4), // component instance

	loop: 9 | (1 << 4), // list,

	return: 10 | (1 << 4) // var
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
