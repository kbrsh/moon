var
  system = require('system'),
  webpage = require('webpage'),
  fs = require('fs'),
  stderr = system.stderr || system.stdout,
  url = system.args[1],
  reporter = system.args[2] || 'spec',
  configured = false,
  runStarted = false,
  isSlimer = 'MozApplicationEvent' in window,
  config = {},
  hookData

try {
  config = JSON.parse(system.args[3] || '{}')
} catch (e) {
  console.log(e)
  console.log('Bad JSON options')
  phantom.exit(255)
}


if (!url) {
  system.stdout.writeLine("Usage: " + (isSlimer ? 'slimerjs' : 'phantomjs') + " mocha-phantomjs-core.js URL REPORTER [CONFIG-AS-JSON]")
  phantom.exit(255)
}

if (phantom.version.major < 1 || (phantom.version.major === 1 && phantom.version.minor < 9)) {
  stderr.writeLine('mocha-phantomjs requires PhantomJS > 1.9.1')
  phantom.exit(-2)
}

// Create and configure the client page
var
  output = config.file ? fs.open(config.file, 'w') : system.stdout,
  page = webpage.create({
    settings: config.settings
  }),
  fail = function(msg, errno) {
    if (output && config.file) {
      output.close()
    }
    if (msg) {
      stderr.writeLine(msg)
    }
    return phantom.exit(errno || 1)
  }

if (config.hooks) {
  hookData = {
    page: page,
    config: config,
    reporter: reporter
  }
  try {
    config.hooks = require(config.hooks)
  }
  catch (e) {
    stderr.writeLine('Error loading hooks: ' + e.message)
    phantom.exit(253)
  }
} else {
  config.hooks = {}
}

if (config.headers) {
  page.customHeaders = config.headers
}
(config.cookies || []).forEach(function(cookie) {
  page.addCookie(cookie)
})
if (config.viewportSize) {
  page.viewportSize = config.viewportSize
}

page.onConsoleMessage = function(msg) {
  return system.stdout.writeLine(msg)
}
page.onResourceError = function(resErr) {
  if (!config.ignoreResourceErrors) {
    return stderr.writeLine("Error loading resource " + resErr.url + " (" + resErr.errorCode + "). Details: " + resErr.errorString)
  }
}
page.onError = function(msg, traces) {
  if (page.evaluate(function() { return !!window.onerror })) return

  fail(msg + '\n' + traces.reduce(function(stack, trace) {
    return stack + '\n  ' + (trace.function ? ' in ' + trace.function + '' : '')
            + ' at ' + trace.file + ':' + trace.line
  }, ''))
}

// Load the test page
page.open(url)
page.onInitialized = function() {
  page.injectJs('browser-shim.js')

  if (isSlimer && config.settings && config.settings.userAgent) {
    page.evaluate(function(ua) {
      navigator.__defineGetter__('userAgent', function() { return ua })
    }, config.settings.userAgent)
  }
}
page.onResourceReceived = function(resource) {
  if (resource.url.match(/mocha\.js$/)) {
    page.evaluate(function() {
      checkForMocha()
    })
  }
}
page.onCallback = function(data) {
  if (data) {
    if (data.stdout) {
      output.write(data.stdout)
    } else if (typeof data.screenshot === 'string') {
      page.render(data.screenshot + '.png')
    } else if (data.viewportSize && (data.viewportSize.width || data.viewportSize.height)) {
      page.viewportSize = {
        width: data.viewportSize.width || page.viewportSize.width,
        height: data.viewportSize.height || page.viewportSize.height,
      }
    } else if (data.configureColWidth) {
      page.evaluate(function(columns) {
        Mocha.reporters.Base.window.width = columns
      }, parseInt(system.env.COLUMNS || 75) * .75 | 0)
    } else if (data.configureMocha) {
      configureMocha()
    } else if ('testRunStarted' in data) {
      if (data.testRunStarted == 0) {
        fail('mocha.run() was called with no tests')
      }
      runStarted = true
    } else if (data.testRunEnded) {
      if (typeof config.hooks.afterEnd === 'function') {
        hookData.runner = data.testRunEnded
        config.hooks.afterEnd(hookData)
      }
      if (config.file) {
        output.close()
      }
      setTimeout(function() {
        phantom.exit(data.testRunEnded.failures)
      }, 100)
    } else if (data.sendEvent) {
      page.sendEvent.apply(page, data.sendEvent)
    }
  }
  return true
}
page.onLoadFinished = function(status) {
  page.onLoadFinished = null
  if (status !== 'success') {
    fail('Failed to load the page. Check the url: ' + url)
    return
  }

  var loadTimeout = config.loadTimeout || 10000
  setTimeout(function() {
    if (!configured) {
      if (page.evaluate(function() { return !window.mocha })) {
        fail('mocha was not found in the page within ' + loadTimeout + 'ms of the page loading.')
      } else if (page.evaluate(function() { return window.initMochaPhantomJS })) {
        fail('Likely due to external resource loading and timing, your tests require calling `window.initMochaPhantomJS()` before calling any mocha setup functions. See https://github.com/nathanboktae/mocha-phantomjs-core/issues/12')
      } else {
        fail('mocha was not initialized within ' + loadTimeout + 'ms of the page loading. Make sure to call `mocha.ui` or `mocha.setup`.')
      }
    } else if (!runStarted) {
      fail('mocha.run() was not called within ' + loadTimeout + 'ms of the page loading.')
    }
  }, loadTimeout)
}

function configureMocha() {
  page.evaluate(function(config, env) {
    mocha.env = env

    mocha.useColors(config.useColors)
    mocha.bail(config.bail)
    if (config.timeout) {
      mocha.timeout(config.timeout)
    }
    if (config.grep) {
      mocha.grep(config.grep)
    }
    if (config.invert) {
      mocha.invert()
    }
  }, config, system.env)

  // setup a the reporter
  if (page.evaluate(setupReporter, reporter) !== true) {
    // we failed to set the reporter - likely a 3rd party reporter than needs to be wrapped
    try {
      var customReporter = fs.read(reporter)
    } catch(e) {
      fail('Unable to open file \'' + reporter + '\'')
    }

    var wrapper = function() {
      var exports, module, process, require;
      require = function(what) {
        what = what.replace(/[^a-zA-Z0-9]/g, '')
        for (var r in Mocha.reporters) {
          if (r.toLowerCase() === what) {
            return Mocha.reporters[r]
          }
        }
        throw new Error("Your custom reporter tried to require '" + what + "', but Mocha is not running in Node.js in mocha-phantomjs, so Node modules cannot be required - only other reporters");
      };
      module = {};
      exports = undefined;
      process = Mocha.process;
      'customreporter';
      return Mocha.reporters.Custom = exports || module.exports;
    },
    wrappedReporter = wrapper.toString().replace("'customreporter'", "(function() {" + (customReporter.toString()) + "})()")

    page.evaluate(wrappedReporter)
    if (page.evaluate(function() { return !Mocha.reporters.Custom }) ||
        page.evaluate(setupReporter) !== true) {
      fail('Failed to use load and use the custom reporter ' + reporter)
    }
  }

  if (typeof config.hooks.beforeStart === 'function') {
    config.hooks.beforeStart(hookData)
  }
  configured = true
}

function setupReporter(reporter) {
  try {
    mocha.setup({
      reporter: reporter || Mocha.reporters.Custom
    })
    return true
  } catch (error) {
    return error
  }
}