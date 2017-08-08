module.exports = (amount, str) => {
  if(amount === 1) {
    return amount + " " + str;
  } else {
    return amount + " " + str + "s";
  }
}
