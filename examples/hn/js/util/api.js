var api = {
  cache: {
    topstories: [],
    newstories: [],
    showstories: [],
    askstories: [],
    jobstories: [],
    items: {}
  }
};

var get = function(endpoint, save) {
  return new Promise(function(resolve, reject) {
    fetch("http://localhost:3000/api/" + endpoint).then(function(response) {
      var json = response.json();
      save(json);
      resolve(json);
    })["catch"](function(err) {
      reject(err);
    });
  });
}

api.getItem = function(id) {
  var cache = api.cache.items;
  var cached = cache[id];
  if(cached === undefined) {
    return get("item/" + id, function(val) {
      cache[id] = val;
    });
  } else {
    return Promise.resolve(cached);
  }
}

api.getList = function(type, page) {
  type += "stories";
  var cache = api.cache;
  var itemCache = cache.items;
  var cached = cache[type];
  if(cached.length === 0) {
    return get("lists/" + type + "/" + page, function(val) {
      cache[type] = val;
      for(var i = 0; i < val.length; i++) {
        var item = val[i];
        itemCache[item.id] = item;
      }
    });
  } else {
    return Promise.resolve(cached);
  }
}

module.exports = api;
