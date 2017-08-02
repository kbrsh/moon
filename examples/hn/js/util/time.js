var MINUTE = 60;
var HOUR = 3600;
var DAY = 86400;

module.exports = function(store, posted) {
  var difference = store.state.now - posted;
  var unit = " minute";
  var passed = 0;

  if(difference < HOUR) {
    passed = difference / MINUTE;
  } else if(difference < DAY) {
    passed = difference / HOUR;
    unit = " hour";
  } else {
    passed = difference / DAY;
    unit = " day";
  }

  passed = passed | 0;

  if(passed > 1) {
    unit += "s";
  }

  return passed + unit + " ago";
}
