# Changelog

#### 2.3.1
* Isolated include to solve some scoping issues that happens when running multiple includes in parallel.

#### 2.3.0
* The automatic throwing of errors caused discomfort for some, now simply warns by default, but added the possibility to turn on if necessary
* Added `hardFail` param
* Moved changelog to CHANGELOG.md. Started taking a lot of space in the README
* Added tests for error throwing

#### 2.2.1
* Now throws an error if glob match is unmet

#### 2.2.0
* Added `includePaths` option, to allow for controlling where the search is incented.

#### 2.1.1
* Strip BOMs, by [dhedey](https://github.com/dhedey)
* Improved HTML comment stripping, by [shdwjk](https://github.com/shdwjk)

#### 2.1.0
* Merged sourcemap support by [vetruvet](https://github.com/vetruvet)
* Merged support for html-comments by [jelmerdemaat](https://github.com/jelmerdemaat)

#### 2.0.3
* Merged community fix by [shadow1runner](https://github.com/shadow1runner)

#### 2.0.2
* Updated replace to support specials [Riim](https://github.com/Riim)

#### 2.0.1
* Fixed an issue with indenting

#### 2.0.0
* Core rewritten to be slimmer and more comprehensive.
* `require` and `include` no longer work the same. `require` will only include a file that hasn't been included yet. See readme for details.
* Tests have been rewritten based on the old ones, but also to fit the new functionality
* Deprecated `require_tree` and `require_directory` as they serve little purpose. Use globs (`path/to/**/*.xxx`) instead.

#### 1.1.1
* Merged community fix by [trolev](https://github.com/trolev)

#### 1.1.0
* Merged feature: Keep leading whitespaces by [maxgalbu](https://github.com/maxgalbu)

#### 1.0.1
* Fixed issue which caused extensions to be "remembered" if `gulp-include` ran multiple times in a row, resulting in lost includes

#### 1.0.0
* Merged major refactoring by [scottmas](https://github.com/scottmas) - Many thanks!
	* Rewritten core (regex, replacing and file mashing)
	* Glob support
	* Recursive support
	* Respecting indentation of included files

* Upping version to 1.0.0 - seems fitting after such a large refactor

#### 0.2.3
* Merged community fixes by [platdesign](https://github.com/platdesign) and [cujojp](https://github.com/cujojp)

#### 0.2.2
* Updated regex directive to not collide with other requireing plugins, like browserify ([cwacek](https://github.com/cwacek))

#### 0.2.1
* Changed replace-method to fix issue when requiring a file that contained special characters ([juanghurtado](https://github.com/juanghurtado))

#### 0.2.0
* Added `require_tree`/`include_tree` (Thanks to [juanghurtado](https://github.com/juanghurtado)!)
* Method now takes an `extensions` param for controlling what types of files to include

#### 0.1.0
* Basic include
