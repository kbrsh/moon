# gulp-uglifyjs changelog

## 0.6.2
- Remove dependency on lodash, path
- Update dependencies
- Update deprecation notice

## 0.6.1
- Don't break pipe when no files given [1791bbf](https://github.com/craigjennings11/gulp-uglifyjs/commit/1791bbf979754d60c26ce205c58c9bfe746eed3c)

## 0.6.0
- Add support for mangle options [f35998c](https://github.com/craigjennings11/gulp-uglifyjs/commit/f35998c7a73dcd2ea24661dc801e34b6bfbe092c)

## 0.5.0

- Adding support for inSourceMap option [12460aa](https://github.com/craigjennings11/gulp-uglifyjs/commit/12460aa1bdcb373d0055ab323077bda5ebd76d35)
- Adding support for sourceRoot option to mirror Uglify.minify() API more closely

## 0.4.4

- Using correct filename for source_map.file option by default [#15](https://github.com/craigjennings11/gulp-uglifyjs/issues/15)

## 0.4.3

- Fixing problem where source wouldn't load in browser [#11](https://github.com/craigjennings11/gulp-uglifyjs/issues/11)

## 0.4.2

- Adding more details to error reporting

## 0.4.1

- Added better reporting when UglifyJS throws an error

## 0.4.0

- Added `sourceMapIncludeSources` option [da7684e](https://github.com/craigjennings11/gulp-uglifyjs/commit/da7684ea23475f5fc78f142ddb1556d9795309ba)

## 0.3.0

- Added `wrap` and `enclose` options [4ca8c29](https://github.com/craigjennings11/gulp-uglifyjs/commit/4ca8c2979fc08d85649056535d0dcb00eff9bb7a)

## 0.2.1

- No longer errors out when no files are passed in

## 0.2.0

- Refactored interaction with UglifyJS to have more granular control over
  compression.
- Fixed [#1](https://github.com/craigjennings11/gulp-uglifyjs/issues/1)

## 0.1.1

- Added tests
- Clarified portions of README

## 0.1.0

- Initial release
