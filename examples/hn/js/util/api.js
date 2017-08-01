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
  var cached = cache[id];
  if(cached === undefined) {
    return get("item/" + id, function(val) {
      cache[id] = val;
    });
  } else {
    return Promise.resolve(cached);
  }
}

api.getList = function(type, page, offset) {
  type += "stories";
  var cache = api.cache;
  var itemCache = cache.items;
  var cached = cache[type];
  if(cached[offset - 1] === undefined) {
    return get("lists/" + type + "/" + page, function(data) {
      var list = data.list;
      cache[type] = list;
      for(var i = 0; i < list.length; i++) {
        var item = list[i];
        itemCache[item.id] = item;
      }
    });
  } else {
    return Promise.resolve(cached);
  }
}

module.exports = api;
