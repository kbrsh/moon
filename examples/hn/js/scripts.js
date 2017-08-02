/*=============================
  Primary Application Code
=============================*/

// Promise
require("./util/promise.js");

// Moon
var Moon = require("moonjs/dist/moon.js");
var MoonRouter = require("moon-router");

// Initialize Store
require("./store/store.js").init(Moon);

// Components
require("./components/list.moon")(Moon);

// Install Moon Router
Moon.use(MoonRouter);

// Initialize Router
var router = new MoonRouter({
  "default": "/",
  "map": {
    "/": "list",
    "/:type": "list",
    "/:type/:page": "list"
  },
  "mode": "history"
});

// Initialize App
new Moon({
  el: "#app",
  router: router
});
