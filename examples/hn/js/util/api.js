// Initialize API
var Firebase = require("firebase/app");
require("firebase/database");

var api = {
  cache: {
    topstories: [],
    items: {}
  }
};

var get = function(child, save) {
  return new Promise(function(resolve, reject) {
    api.db.child(child).once("value", function(snapshot) {
      var val = snapshot.val();
      save(val);
      resolve(val);
    });
  });
}

api.getItem = function(id) {
  var cache = api.cache;
  var cached = cache.items[id];
  if(cached === undefined) {
    return get("item/" + id, function(val) {
      cache.items[id] = val;
    });
  } else {
    return Promise.resolve(cached);
  }
}

api.getItems = function(ids) {
  var idsLength = ids.length;
  var items = new Array(idsLength);
  for(var i = 0; i < idsLength; i++) {
    items[i] = api.getItem(ids[i]);
  }
  return Promise.all(items);
}

api.getList = function(type) {
  type += "stories";
  var cache = api.cache;
  var cached = cache[type];
  if(cached.length === 0) {
    return get(type, function(val) {
      cache[type] = val;
    });
  } else {
    return Promise.resolve(cached);
  }
}

module.exports.init = function() {
  api.db = Firebase.initializeApp({
    databaseURL: "https://hacker-news.firebaseio.com"
  }).database().ref("/v0");
}

module.exports.api = api;
