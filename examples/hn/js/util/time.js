const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;

module.exports = (store, posted) => {
  const difference = store.state.now - posted;
  let unit = " minute";
  let passed = 0;

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
