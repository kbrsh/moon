# Contributing

Hey! I'm super glad you're interested in contributing to Moon. Helpful contributions are always welcome.

Please ensure you have understood the guidelines before contributing, it helps keep the code organized.

* [Development Setup](https://github.com/KingPixil/moon/blob/master/CONTRIBUTING.md#development-setup)
* [Development](https://github.com/KingPixil/moon/blob/master/CONTRIBUTING.md#development)
* [Submitting an Issue](https://github.com/KingPixil/moon/blob/master/CONTRIBUTING.md#submitting-an-issue)
* [Submitting a Pull Request](https://github.com/KingPixil/moon/blob/master/CONTRIBUTING.md#submitting-a-pull-request)

### Development Setup

Before you begin editing the code, make sure you have [Node](https://nodejs.org) v7.0.0+ installed. This is required for building Moon and running tests.

1. Fork/Clone the repository
2. Install dependencies with `npm install`

### Development

Now that you're all set up, you're ready to edit the code. All code you write should not be dependent on the browser *or* Node. It should be able to run in all Javascript environments.

1. Update files in the `src` folder
2. If necessary, add tests in the `test` folder
3. Build files with `npm run build`
4. Ensure tests are running with `npm run test`

##### Scripts

```sh
$ npm run build # builds files in "dist" folder

$ npm run test # runs tests in the browser
```

##### Commits

Commit messages should follow a format of:

```
category: summary (info about issues fixed)

body text with additional information if needed
```

Categories you can use are:

* `feat` - Indicates adding a feature
* `fix` - Indicates fixing a bug
* `perf` - Indicates improving performance

Information about issues fixed should include any issues fixed as a result of the commit, and should follow a format of:

```
(fixes #17)
```

Be sure to put the number of the issue you fixed.

##### File Structure

* `src` - main source files
  * `compiler` - code for the compiler, which is responsible for lexing, parsing, optimizing, and generating code for templates.
  * `directives` - code for all directives, including ones that are invoked at runtime, and special directives that generate code
  * `global` - code for the global API
  * `instance` - code for instance methods
  * `observer` - code for the dependency tracking system, and changing the context of methods
  * `util` - code for utilities used throughout the codebase
  * `index.js` - code that defines the Moon constructor and normalizes all options
  * `wrapper.js` - code that exports Moon correctly depending on the environment
* `dist` - distribution files
  * `moon.js` - development version of moon
  * `moon.min.js` - production (minified + no warnings) version of moon
* `build` - scripts for automating certain build tasks
  * `release.js` - generates release notes and copies them to the clipboard
  * `travis.sh` - script for Travis CI to run for every push to Git or a PR
* `test` - files for testing
  * `test` - folder with actual test definitions
    * `core` - all core tests
  * `index.html` - HTML file for Mocha/Chai Phantom browser tests
  * `log.js` - file that logs the browser test URL
* `benchmarks` - benchmarks for measuring performance
  * `dbmon` - DBMonster benchmark code
  * `loop` - Loop benchmark code

### Submitting an Issue

Submit an issue for the following reasons:

* You've found a bug
* You'd like to request a feature
* You have ideas about performance
* You have a general question for discussion

### Submitting a Pull Request

Submit a pull request if you'd like to address an issue. Be sure to follow the [development guide](https://github.com/KingPixil/moon/blob/master/CONTRIBUTING.md#development).
