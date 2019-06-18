module.exports = {
	collectCoverage: true,
	collectCoverageFrom: ["packages/*/src/**/!(wrapper).js"],
	coverageDirectory: "coverage"
};
