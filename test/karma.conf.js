module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha'],

    files: [
      '../dist/moon.js',
      '../node_modules/chai/chai.js',
      './core/util.js',
      './core/instance/*.js',
      './core/compiler/*.js',
      './core/directives/*.js',
      './core/plugin/*.js',
      './core/component/*.js',
      './core/events/*.js',
      './core/util/*.js'
    ],

    exclude: [
    ],

    preprocessors: {
      '../dist/moon.js': ['coverage']
    },

    reporters: ['spec', 'coverage'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: false,

    browsers: ['PhantomJS'],

    singleRun: true,

    concurrency: Infinity,

    coverageReporter: {
      type: 'text',
      dir: '../coverage/',
      reporters: [
        {
          type: 'lcovonly',
          subdir: '.'
        },
        {
          type: 'json',
          subdir: '.'
        }
      ]
    }
  })
}
