import run from "moon/src/run";

export let componentMain;

export function main(component) {
	componentMain = component;

	run();
}
