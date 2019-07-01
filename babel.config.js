module.exports = {
	presets: [
		["@babel/preset-env", {
			exclude: ["@babel/plugin-transform-typeof-symbol"]
		}]
	],
	plugins: [
		["@babel/plugin-transform-template-literals", {
			loose: true
		}]
	]
};
