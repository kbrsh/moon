const Cached = require("./cached.js");

let api = {
  cache: {
    topstories: [],
    newstories: [],
    showstories: [],
    askstories: [],
    jobstories: [],
    items: new Cached(100),
    users: new Cached(10)
  }
};

const get = (endpoint, save) => {
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

api.getItem = (id) => {
  let cache = api.cache.items;
  if(cache.has(id) === false) {
    return get("item/" + id, function(val) {
      cache.set(id, val);
    });
  } else {
    return Promise.resolve(cache.get(id));
  }
}

api.getList = (type, page) => {
  type += "stories";
  let cache = api.cache;
  let itemCache = cache.items;
  const result = cache[type];

  if(result[0] === page) {
    return Promise.resolve({
      list: result[1],
      next: result[2]
    });
  } else {
    return get("lists/" + type + "/" + page, function(data) {
      const list = data.list;
      cache[type] = [page, list, data.next];
      for(var i = 0; i < list.length; i++) {
        var item = list[i];
        itemCache.set(item.id, item);
      }
    });
  }
}

api.getUser = (id) => {
  let cache = api.cache.users;
  if(cache.has(id) === false) {
    return get("user/" + id, function(val) {
      cache.set(id, val);
    });
  } else {
    return Promise.resolve(cache.get(id));
  }
}

api.getComments = (id) => {
  return get("comments/" + id, function(val) {});
}

module.exports = api;
