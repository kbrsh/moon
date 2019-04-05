module.exports = {
	presets: ["@babel/preset-env"],
	plugins: [
		["@babel/plugin-transform-template-literals", {
			loose: true
		}]
	]
};
