/*=============================
  Primary Application Code
=============================*/

// Promise
require("./util/promise.js");

// Moon
var Moon = require("moonjs/dist/moon.js");
var MoonRouter = require("moon-router");

// API Initializer
var initAPI = require("./util/api.js").init;

// Initialize Store
require("./store/store.js").init(Moon);

// Components
require("./components/list.moon")(Moon);

// Install Moon Router
Moon.use(MoonRouter);

// Initialize API
initAPI();

// Initialize Router
var router = new MoonRouter({
  "default": "/",
  "map": {
    "/": "list",
    "/:type": "list",
    // "/:type/:page": "list"
  }
});

// Initialize App
new Moon({
  el: "#app",
  router: router
});
