var Sold = require("sold");

Sold(__dirname)
  .data({
    // version: require("moonjs").version
  })
  .engine("ejs")
  .source("src")
  .destination("")
  .build();
