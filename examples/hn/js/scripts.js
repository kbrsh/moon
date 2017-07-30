/*=============================
  Primary Application Code
=============================*/

var Moon = require("moonjs");
var MoonRouter = require("moon-router");
var Monx = require("monx");
require("./components/home.moon")(Moon);

Moon.use(MoonRouter);
Moon.use(Monx);

var router = new MoonRouter({
  "default": "/",
  "map": {
    "/": "home"
  }
});

new Moon({
  el: "#app"
});
