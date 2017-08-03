module.exports = function(amount, str) {
  if(amount === 1) {
    return amount + " " + str;
  } else {
    return amount + " " + str + "s";
  }
}
