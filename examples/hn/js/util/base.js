const hostnameRE = /([\w\d-]+\.[\w\d-]+)(?:\/[\w\d-/.?=#&%@;:+!\(\)]*)?$/;

module.exports = (url) => {
  return hostnameRE.exec(url)[1];
}
