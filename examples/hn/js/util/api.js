var Cached = require("./cached.js");

var api = {
  cache: {
    topstories: [],
    newstories: [],
    showstories: [],
    askstories: [],
    jobstories: [],
    items: new Cached(100)
  }
};

var get = function(endpoint, save) {
  return new Promise(function(resolve, reject) {
    fetch("http://localhost:3000/api/" + endpoint).then(function(response) {
      response.json().then(function(json) {
        save(json);
        resolve(json);
      });
    })["catch"](function(err) {
      reject(err);
    });
  });
}

api.getItem = function(id) {
  var cache = api.cache.items;
  if(cache.has(id) === false) {
    return get("item/" + id, function(val) {
      cache.set(id, val);
    });
  } else {
    return Promise.resolve(cache.get(id));
  }
}

api.getList = function(type, page) {
  type += "stories";
  var cache = api.cache;
  var itemCache = cache.items;
  var result = cache[type];

  if(result[0] === page) {
    return Promise.resolve({
      list: result[1],
      next: page < 17
    });
  } else {
    return get("lists/" + type + "/" + page, function(data) {
      var list = data.list;
      cache[type] = [page, list];
      for(var i = 0; i < list.length; i++) {
        var item = list[i];
        itemCache.set(item.id, item);
      }
    });
  }
}

api.getComments = function(id) {
  return get("comments/" + id, function(val) {});
}

module.exports = api;
