import parse from "moon-compiler/src/parse";
import generate from "moon-compiler/src/generate";
import compile from "moon-compiler/src/compile";

export default {
	compile,
	generate,
	parse,
	version: process.env.MOON_VERSION
};
