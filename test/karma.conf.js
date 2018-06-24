module.exports = function(config) {
	config.set({
		basePath: "",
		frameworks: ["mocha"],

		files: [
			"../dist/moon.js",
			"../node_modules/chai/chai.js",
			"./core/*.js",
			"./core/*/*.js"
		],

		exclude: [
		],

		preprocessors: {
			"../dist/moon.js": ["coverage"]
		},

		reporters: ["spec", "coverage"],

		port: 9876,

		colors: true,

		logLevel: config.LOG_INFO,

		autoWatch: false,

		browsers: ["PhantomJS"],

		singleRun: true,

		concurrency: Infinity,

		coverageReporter: {
			type: "text",
			dir: "../coverage/",
			reporters: [
				{
					type: "lcovonly",
					subdir: "."
				},
				{
					type: "json",
					subdir: "."
				},
				{
					type: "text-summary",
					subdir: ".",
					file: "summary.txt"
				}
			]
		}
	})
}
