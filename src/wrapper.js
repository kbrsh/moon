(function(root, factory) {
  /* ======= Global Moon ======= */
  if(typeof module === "undefined") {
    root.Moon = factory();
  } else {
    module.exports = factory();
  }
}(this, function() {
    //=require ../dist/moon.js
    return Moon;
}));
