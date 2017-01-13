(function(){

  if (typeof Function.prototype.bind !== 'function') {
    Function.prototype.bind = function bind(obj) {
      var args = Array.prototype.slice.call(arguments, 1),
        self = this,
        nop = function() {},
        bound = function() {
          return self.apply(
            this instanceof nop ? this : (obj || {}), args.concat(
              Array.prototype.slice.call(arguments)
            )
          )
        }
      nop.prototype = this.prototype || {}
      bound.prototype = new nop()
      return bound
    }
  }

  function isFileReady(readyState) {
    // Check to see if any of the ways a file can be ready are available as properties on the file's element
    return (!readyState || readyState == 'loaded' || readyState == 'complete' || readyState == 'uninitialized')
  }

  function shimMochaProcess(M) {
    // Mocha needs a process.stdout.write in order to change the cursor position.
    M.process = M.process || {}
    M.process.stdout = M.process.stdout || process.stdout
    M.process.stdout.write = function(s) { window.callPhantom({ stdout: s }) }
    window.callPhantom({ getColWith: true })
  }

  function shimMochaInstance(m) {
    var origRun = m.run, origUi = m.ui
    m.ui = function() {
      var retval = origUi.apply(mocha, arguments)
      window.callPhantom({ configureMocha: true })
      m.reporter = function() {}
      return retval
    }
    m.run = function() {
      window.callPhantom({ testRunStarted: m.suite.suites.length })
      m.runner = origRun.apply(mocha, arguments)
      if (m.runner.stats && m.runner.stats.end) {
        window.callPhantom({ testRunEnded: m.runner })
      } else {
        m.runner.on('end', function() {
          window.callPhantom({ testRunEnded: m.runner })
        })
      }
      return m.runner
    }
  }

  Object.defineProperty(window, 'checkForMocha', {
    value: function() {
      var scriptTags = document.querySelectorAll('script'),
          mochaScript = Array.prototype.filter.call(scriptTags, function(s) {
            var src = s.getAttribute('src')
            return src && src.match(/mocha\.js$/)
          })[0]

      if (mochaScript) {
        mochaScript.onreadystatechange = mochaScript.onload = function () {
          if (isFileReady(mochaScript.readyState)) {
            initMochaPhantomJS()
          }
        }
      }
    }
  })

  if ('mozInnerScreenX' in window) {
    // in slimerjs, we can stub out a setter to shim Mocha. phantomjs 2 fails
    // to allow the property to be reconfigured...
    Object.defineProperty(window, 'mocha', {
      get: function() { return undefined },
      set: function(m) {
        shimMochaInstance(m)
        delete window.mocha
        window.mocha = m
      },
      configurable: true
    })

    Object.defineProperty(window, 'Mocha', {
      get: function() { return undefined },
      set: function(m) {
        delete window.Mocha
        window.Mocha = m
        shimMochaProcess(m)
      },
      configurable: true
    })
  } else {
    Object.defineProperty(window, 'initMochaPhantomJS', {
      value: function () {
        shimMochaProcess(Mocha)
        shimMochaInstance(mocha)
        delete window.initMochaPhantomJS
      },
      configurable: true
    })
  }

  // Mocha needs the formating feature of console.log so copy node's format function and
  // monkey-patch it into place. This code is copied from node's, links copyright applies.
  // https://github.com/joyent/node/blob/master/lib/util.js
  if (!console.format) {
    console.format = function(f) {
      if (typeof f !== 'string') {
        return Array.prototype.map.call(arguments, function(arg) {
          try {
            return JSON.stringify(arg)
          }
          catch (_) {
            return '[Circular]'
          }
        }).join(' ')
      }
      var i = 1;
      var args = arguments;
      var len = args.length;
      var str = String(f).replace(/%[sdj%]/g, function(x) {
        if (x === '%%') return '%';
        if (i >= len) return x;
        switch (x) {
          case '%s': return String(args[i++]);
          case '%d': return Number(args[i++]);
          case '%j':
            try {
              return JSON.stringify(args[i++]);
            } catch (_) {
              return '[Circular]';
            }
          default:
            return x;
        }
      });
      for (var x = args[i]; i < len; x = args[++i]) {
        if (x === null || typeof x !== 'object') {
          str += ' ' + x;
        } else {
          str += ' ' + JSON.stringify(x);
        }
      }
      return str;
    };
    var origError = console.error;
    console.error = function(){ origError.call(console, console.format.apply(console, arguments)); };
    var origLog = console.log;
    console.log = function(){ origLog.call(console, console.format.apply(console, arguments)); };
  }

})();
