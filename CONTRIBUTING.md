# Contributing

Hey! I'm super glad you're interested in contributing to Moon. Helpful contributions are always welcome.

Please ensure you have understood the guidelines before contributing, it helps keep the code organized.

* [Development Setup](https://github.com/kbrsh/moon/blob/master/CONTRIBUTING.md#development-setup)
* [Development](https://github.com/kbrsh/moon/blob/master/CONTRIBUTING.md#development)
* [Submitting an Issue](https://github.com/kbrsh/moon/blob/master/CONTRIBUTING.md#submitting-an-issue)
* [Submitting a Pull Request](https://github.com/kbrsh/moon/blob/master/CONTRIBUTING.md#submitting-a-pull-request)

### Development Setup

Before you begin editing the code, make sure you have [Node](https://nodejs.org) installed. This is required for building Moon and running tests.

1. Fork/clone the repository
2. Install dependencies with `npm install`

### Development

Now that you're all set up, you're ready to edit the code.

Moon's source is split up into multiple packages. Each package has its own tests and build configuration. The development process usually looks like this:

1. `cd` into the package you're working on.
1. Update files in the `src` folder using a text editor.
2. If necessary, add tests in the `test` folder.
3. Build files with `npm run build`.
4. Ensure tests are running with `npm run test`.

##### Scripts

```sh
$ npm run build # builds files in the `packages/[package]/dist` folders

$ npm run test # runs tests for all packages
```

##### Commits

Commit messages should follow a format of:

```
summary of changes (reference issue/PR)

* body bullet points
* additional information goes here
```

Information about issues fixed should include any issues fixed as a result of the commit, and should follow a format of:

```
(fixes #17)
```

Be sure to put the number of the issue you fixed.

### Submitting an Issue

Submit an issue for the following reasons:

* You've found a bug
* You'd like to request a feature
* You have ideas about performance
* You have a general question for discussion

### Submitting a Pull Request

Submit a pull request if you'd like to address an issue. Be sure to follow the [development guide](https://github.com/kbrsh/moon/blob/master/CONTRIBUTING.md#development).
