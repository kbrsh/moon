
3.5.3 / 2015-01-14 

 * Implement the grep option, -g, and -i for inverting it. Fixes #145
 * Add --ignore-resource-errors switch to hide resource errors from output (#169)

3.5.2 / 2014-12-05

 * Added screenshot support. Fixes #130 and #165.

3.5.1 / 2014-10-07

 * fixed keyval parser to support multiple '=' signs (#155)

3.5.0 / 2014-06-24

 * Add a test for --no-colors. fixes #137
 * Upgrade mocha to ~1.20.1 and commander to ~2.0.0. Fixes #143
 * Provide a more informative error if an error occurs while launching phantomjs. Fixes #141
 * Robustly handle phantomjs callbacks. Fixes #140

3.4.1 / 2014-05-15

  * Ensure that a custom reporter is a file
  * Use the phantomjs module correctly. Fixes #136.

3.4.0 / 2014-05-07

  * phantomjs is now a peer dependency for easier installation and local isolation.

3.3.2 / 2014-02-12

  * Exit with 1 if no exit code at all. Fixes #121

3.3.1 / 2014-01-02

  * Send phantomjs stderr to stderr not stdout. Fixes #116

3.3.0 / 2013-12-13

  * Third party reporters are now supported via -R or --reporter

3.2.0 / 2013-12-09

  * --file option for piping reporter output to a file.
  * --hooks option for providing a module of event handlers of mocha-phantomjs events. Two events are currently supported: `beforeStart` and `afterEnd`

3.1.7 / 2013-11-28

  * Log PhantomJS resource errors. Fixes #109.

3.1.6 / 2013-11-06

  * Ensure PhantomJS version to be >= 1.9 (the latest 1.9.x is recommended.)

3.1.5 / 2013-10-01

  * Report all failing async tests. Fixes #97.


3.1.4 / 2013-09-26

  * Warn when phantomjs can not be found for --path argument. Fixes #95 and #92 again.

3.1.3 / 2013-09-22

  * Added check to find phantomjs in the path before looking in the module path. Fixes #92.
  * Test with Chai.js v1.8.x
  * Test with Mocha.js v1.13.x


3.1.2 / 2013-08-22

  * Add window.mochaPhantomJS.env. Fixes #91.


3.1.1 / 2013-08-14

  * Produce Mocha.process.stdout if it doesn't exist


3.1.0 / 2013-07-01

  * Update to Mocha 1.12.x and Chai 1.7.x


3.0.0 / 2013-06-06

  * Focus on latest PhantomJS 1.9.1.
  * Remove all Reporter subclasses. All reporter args should likely just work.
  * Set package.json to mocha 1.9.x and chai 1.6.x


2.0.3 / 2013-06-06

  * Should fail when there is a page error.


2.0.2 / 2013-05-14

  * Change --cookie to --cookies and take full object. Fixes #31.
  * Tested with Mocha 1.8.2. Fixes #37.
  * Tested with Chai 1.5.0. Fixed #30.
  * Tested with PhantomJS 1.9.0.
  * Fixed list reporter.


2.0.1 / 2013-03-04

  * Option to remove colors like mocha's --no-color. Thanks @nathanboktae


2.0.0 / 2013-01-25

  * Lock down package.json to mocha 1.7, 1.8 after http://git.io/GYJCTw is resolved.
  * Notify if phantomjs is not installed.


1.1.3 / 2013-01-16

  * Fix error code 127 on Windows. Thanks @romario333


1.1.2 / 2012-12-19
==================

  * Fix iframe usage.
  * Allow a local npm of phantomjs to work.


1.1.1 / 2012-12-08
==================

  * Fix spec CR regexp.
  * More PhantomJS args, timeout, cookie, header, setting, viewport.


1.1.0 / 2012-11-21
==================

  * Tested with Mocha 1.7
  * New -A UserAgent argument passed to PhantomJS.


1.0.1 / 2012-10-25
==================

  * Tested with Mocha 1.4, 1.5 and 1.6


1.0.0 / 2012-10-25
==================

  * Initial release!

