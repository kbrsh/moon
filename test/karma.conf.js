module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha'],

    files: [
      '../coverage/moon.js',
      '../node_modules/chai/chai.js',
      './js/test.js',
    ],

    exclude: [
    ],

    preprocessors: {
    },

    reporters: ['spec'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: false,

    browsers: ['PhantomJS'],

    singleRun: true,
    
    concurrency: Infinity
  })
}
