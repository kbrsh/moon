module.exports = {
	name: "Moon CLI",
	exportName: "MoonCLI",
	format: "iife",
	transformBefore: (output) => output,
	transformAfter: (developmentCode, productionCode) => ({ developmentCode, productionCode })
};
