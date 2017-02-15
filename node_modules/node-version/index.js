module.exports = (function() {
  var version = process.version;

  if (version.indexOf('v') > -1) {
    version = version.split('v')[1];
  }

  var split = version.split('.');

  return {
    original: process.version,
    short: split[0] + '.' + split[1],
    long: split[0] + '.' + split[1] + '.' + split[2],
    major: split[0],
    minor: split[1],
    build: split[2]
  };
})();
