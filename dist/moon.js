/**
 * Moon v1.0.0-alpha
 * Copyright 2016-2018 Kabir Shah
 * Released under the MIT License
 * https://kbrsh.github.io/moon
 */
(function(root, factory) {
  if (typeof module === "undefined") {
    root.Moon = factory();
  } else {
    module.exports = factory();
  }
}(this, function() {
  "use strict";

  var config = {
    silent: ("development" === "production") || (typeof console === "undefined")
  };

  var createGlobal = function (Moon) {
    Moon.config = config;
  };

  function Moon() {

  }

  createGlobal(Moon);

  return Moon;
}));
