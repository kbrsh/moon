var KEY = "moon-hn-cache";

// Global
var IMG_PATH = "/dist/img/logo.png";
var INDEX_PATH = "/dist/index.html";

// Development
var CSS_PATH = "/dist/css/build.min.css";
var JS_PATH = "/dist/js/build.min.js";

// Production
// var CSS_PATH = "/dist/css/build.hash.css";
// var JS_PATH = "/dist/js/build.hash.js";

var CACHED = [INDEX_PATH, CSS_PATH, JS_PATH, IMG_PATH];

var CACHE_RE = /api|topstories|newstories|showstories|askstories|jobstories/;

var add = function(request, response) {
  if(response.ok === true) {
    var clone = response.clone();
    caches.open(KEY).then(function(cache) {
      cache.put(request, clone);
    });
  }

  return response;
}

var get = function(request) {
  return caches.open(KEY).then(function(cache) {
    return new Promise(function(resolve, reject) {
      cache.match(request).then(function(response) {
        if(response === undefined) {
          reject();
        } else {
          resolve(response);
        }
      });
    });
  });
}

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(KEY).then(function(cache) {
      return Promise.all([cache.add(INDEX_PATH), cache.add(CSS_PATH), cache.add(JS_PATH), cache.add(IMG_PATH)]);
    })
  );
});

self.addEventListener("fetch", function(event) {
  var request = event.request;

  if(request.method === "GET") {
    var url = request.url;
    var path = url.replace(self.location.origin, "");
    if(CACHED.indexOf(path) === -1) {
      if(url === path && CACHE_RE.test(url) === true) {
        event.respondWith(
          fetch(request).then(function(response) {
            return add(request, response);
          }).catch(function() {
            return get(request);
          })
        );
      }
    } else {
      event.respondWith(
        get(request).catch(function() {
          return fetch(request).then(function(response) {
            return add(request, response);
          });
        })
      );
    }
  }
});
