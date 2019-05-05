module.exports = {
	name: "Moon MVL",
	exportName: "MoonMVL",
	format: "esm",
	transformBefore: (output) => output.replace("export default index;", "module.exports = index;"),
	transformAfter: (developmentCode, productionCode) => ({
		developmentCode: developmentCode.replace("module.exports = index;", "export default index;"),
		productionCode: productionCode.replace("module.exports=index;", "export default index;")
	})
};
