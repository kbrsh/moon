var hostnameRE = /([\w\d-]+\.[\w\d-]+)(?:\/[\w\d-/.?=#&%@;:+!\(\)]*)?$/;

module.exports = function(url) {
  return hostnameRE.exec(url)[1];
}
