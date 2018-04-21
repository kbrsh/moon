(function(root, factory) {
  if(typeof module === "undefined") {
    root.Moon = factory();
  } else {
    module.exports = factory();
  }
}(this, function() {
	"use strict";

	function Moon() {

	}

	return Moon;
}));
