module.exports = function(config) {
  const customLaunchers = {
    sl_chrome: {
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'Windows 7',
      version: '59'
    },
    sl_firefox: {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '54'
    },
    sl_safari: {
      base: 'SauceLabs',
      browserName: 'safari',
      version: '10'
    },
    sl_ie_11: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '11'
    },
    sl_ie_10: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '10'
    },
    sl_ie_9: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '9'
    }
  }

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
    },

    reporters: ['spec', 'saucelabs'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: false,

    browsers: ['PhantomJS'],

    singleRun: true,

    concurrency: Infinity,

    sauceLabs: {
        testName: 'Moon Tests'
    },

    customLaunchers: customLaunchers,

    browsers: Object.keys(customLaunchers)
  })
}
