# Contributing

Hey! I'm super glad you're interested in contributing to Moon. Helpful contributions are always welcome.

Please ensure you have understood the guidelines before contributing, it helps keep the code organized.

* [Development Setup](https://github.com/kbrsh/moon/blob/master/CONTRIBUTING.md#development-setup)
* [Development](https://github.com/kbrsh/moon/blob/master/CONTRIBUTING.md#development)
* [Submitting an Issue](https://github.com/kbrsh/moon/blob/master/CONTRIBUTING.md#submitting-an-issue)
* [Submitting a Pull Request](https://github.com/kbrsh/moon/blob/master/CONTRIBUTING.md#submitting-a-pull-request)

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

* `breaking` - Indicates a breaking change
* `feat` - Indicates adding a feature
* `fix` - Indicates fixing a bug
* `perf` - Indicates improving performance
* `refactor` - Indicates refactoring of code
* `docs` - Indicates updating documentation

Information about issues fixed should include any issues fixed as a result of the commit, and should follow a format of:

```
(fixes #17)
```

Be sure to put the number of the issue you fixed.

##### File Structure

TODO

### Submitting an Issue

Submit an issue for the following reasons:

* You've found a bug
* You'd like to request a feature
* You have ideas about performance
* You have a general question for discussion

### Submitting a Pull Request

Submit a pull request if you'd like to address an issue. Be sure to follow the [development guide](https://github.com/kbrsh/moon/blob/master/CONTRIBUTING.md#development).
