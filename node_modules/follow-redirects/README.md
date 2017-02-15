## Follow Redirects

Drop in replacement for Nodes `http` and `https` that automatically follows redirects.

[![Build Status](https://travis-ci.org/olalonde/follow-redirects.svg?branch=master)](https://travis-ci.org/olalonde/follow-redirects)
[![Coverage Status](https://coveralls.io/repos/olalonde/follow-redirects/badge.svg?branch=master)](https://coveralls.io/r/olalonde/follow-redirects?branch=master)
[![Code Climate](https://codeclimate.com/github/olalonde/follow-redirects/badges/gpa.svg)](https://codeclimate.com/github/olalonde/follow-redirects)
[![Dependency Status](https://david-dm.org/olalonde/follow-redirects.svg)](https://david-dm.org/olalonde/follow-redirects)
[![devDependency Status](https://david-dm.org/olalonde/follow-redirects/dev-status.svg)](https://david-dm.org/olalonde/follow-redirects#info=devDependencies)

[![NPM](https://nodei.co/npm/follow-redirects.png?downloads=true)](https://nodei.co/npm/follow-redirects/)

`follow-redirects` provides [request](https://nodejs.org/api/http.html#http_http_request_options_callback) and [get](https://nodejs.org/api/http.html#http_http_get_options_callback)
 methods that behave identically to those found on the native [http](https://nodejs.org/api/http.html#http_http_request_options_callback) and [https](https://nodejs.org/api/https.html#https_https_request_options_callback)
 modules, with the exception that they will seamlessly follow redirects.

```javascript
var http = require('follow-redirects').http;
var https = require('follow-redirects').https;

http.get('http://bit.ly/900913', function (res) {
  res.on('data', function (chunk) {
    console.log(chunk);
  });
}).on('error', function (err) {
  console.error(err);
});
```

By default the number of redirects is limited to 5, but you can modify that globally or per request.

```javascript
require('follow-redirects').maxRedirects = 10;   // Has global affect (be careful!)

https.request({
  host: 'bitly.com',
  path: '/UHfDGO',
  maxRedirects: 3   // per request setting
}, function (res) {/* ... */});
```

You can inspect the redirection chain from the `fetchedUrls` array on the `response`.
The array is populated in reverse order, so the original url you requested will be the
last element, while the final redirection point will be at index 0.

```javascript
https.request({
  host: 'bitly.com',
  path: '/UHfDGO',
}, function (res) {
  console.log(res.fetchedUrls);
  // [ 'http://duckduckgo.com/robots.txt',  'http://bitly.com/UHfDGO' ]
});
```

## Browserify Usage

Due to the way `XMLHttpRequest` works, the `browserify` versions of `http` and `https` already follow redirects.
 If you are *only* targetting the browser, then this library has little value for you. If you want to write cross
 platform code for node and the browser, `follow-redirects` provides a great solution for making the native node
 modules behave the same as they do in browserified builds in the browser. To avoid bundling unnecessary code
 you should tell browserify to swap out `follow-redirects` with the standard modules when bundling.
 To make this easier, you need to change how you require the modules:

```javascript
var http = require('follow-redirects/http');
var https = require('follow-redirects/https');
```

You can then replace `follow-redirects` in your browserify configuration like so:

```javascript
"browser": {
  "follow-redirects/http"  : "http",
  "follow-redirects/https" : "https"
}
```

The `browserify-http` module has not kept pace with node development, and no long behaves identically to the native
 module when running in the browser. If you are experiencing problems, you may want to check out
 [browserify-http-2](https://www.npmjs.com/package/http-browserify-2). It is more actively maintained and
 attempts to address a few of the shortcomings of `browserify-http`. In that case, your browserify config should
 look something like this:

```javascript
"browser": {
  "follow-redirects/http"  : "browserify-http-2/http",
  "follow-redirects/https" : "browserify-http-2/https"
}
```

## Contributing

Pull Requests are always welcome. Please [file an issue](https://github.com/olalonde/follow-redirects/issues)
 detailing your proposal before you invest your valuable time. Additional features and bug fixes should be accompanied
 by tests. You can run the test suite locally with a simple `npm test` command.

## Debug Logging

`follow-redirects` uses the excellent [debug](https://www.npmjs.com/package/debug) for logging. To turn on logging
 set the environment variable `DEBUG=follow-redirects` for debug output from just this module. When running the test
 suite it is sometimes advantageous to set `DEBUG=*` to see output from the express server as well.

## Authors

Olivier Lalonde (olalonde@gmail.com)

James Talmage (james@talmage.io)

## License

MIT: [http://olalonde.mit-license.org](http://olalonde.mit-license.org)
