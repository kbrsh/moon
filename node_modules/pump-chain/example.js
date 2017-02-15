/* eslint-disable func-names */
'use strict';

var pump = require('./');

var crypto = require('crypto');
var fs = require('fs');
var zlib = require('zlib');

var gzip = zlib.createGzip();
var password = new Buffer('car cat tree fireman');
var aes = crypto.createCipher('aes-256-cbc', password);
// note: this file might only exist on linux?
var rs = fs.createReadStream('/usr/share/dict/words');
var ws = fs.createWriteStream('/tmp/pump-chain-example.encrypted');

var handleError = function handleError(err) {
  console.error('\n!!! something bad happened while streaming stuff !!!\n');
  throw err;
};

// #1 without pump-chain
/*
rs  // reads from file
  .on('error', handleError)
  .pipe(aes)  // encrypts with aes256
  .on('error', handleError)
  .pipe(gzip) // compresses
  .on('error', handleError)
  .pipe(ws)  // writes to disk
  .on('error', handleError);
*/

// #2 with pump-chain
// Note: this has the added benefits of http://npm.im/pump
// (destroys all of them if one of them closes)
pump(rs, aes, gzip, ws);
ws.on('error', handleError);

var i = 0;
rs.on('data', function() {
  if (++i === 3) {
    this.emit('error', new Error('3 is unlucky!'));
  }
});
