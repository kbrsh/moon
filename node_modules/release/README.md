![](https://raw.githubusercontent.com/zeit/art/e0348ab1848337de87ccbb713fa33345aa0ba153/release/repo-banner.png)

[![Build Status](https://travis-ci.org/zeit/release.svg?branch=master)](https://travis-ci.org/zeit/release)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Slack Channel](https://zeit-slackin.now.sh/badge.svg)](https://zeit.chat)

When run, this command line interface automatically generates a new [GitHub Release](https://help.github.com/articles/creating-releases/) and populates it with the changes (commits) made since the last release.

## Usage

Install the package from [npm](https://npmjs.com/release) (you'll need the latest version of [Node](https://nodejs.org) - [why?](https://github.com/zeit/release/blob/5109c726441f002c969c083029511e406f3cd033/bin/release.js#L2)):

```bash
npm install -g release
```

Run this command inside your terminal (in your project's directory):

```bash
release
```

You can find an example of how to prepare a release in your project [here](https://github.com/zeit/release/wiki/Example).

### Options

The following command will show you a list of all available options:

```bash
release help
```

## Change Types

Each commit can be assigned a certain type of change. [Here](https://github.com/zeit/release/wiki/Change-Types)'s the full list.

## Why?

As we at [ZEIT](https://github.com/zeit) moved all of our GitHub repositories from keeping a `HISTORY.md` file to using [GitHub Releases](https://help.github.com/articles/creating-releases/), we needed a way to automatically generate these releases from our own devices, rather than always having to open a page in the browser and manually add the notes for each change.

## Contributing

You can find the authentication flow [here](https://github.com/zeit/release-auth).

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Uninstall the package if it's already installed: `npm uninstall -g release`
3. Link the package to the global module directory: `npm link`
4. You can now use `release` on the command line!

As always, you can use `npm test` to run the tests and see if your changes have broken anything.

## Credits

Thanks a lot to [Daniel Chatfield](https://github.com/danielchatfield) for donating the "release" name on [npm](https://www.npmjs.com) and [my lovely team](https://zeit.co/about) for telling me about their needs and how I can make this package as efficient as possible.

## Author

Leo Lamprecht ([@notquiteleo](https://twitter.com/notquiteleo)) - [▲ZEIT](https://zeit.co)
