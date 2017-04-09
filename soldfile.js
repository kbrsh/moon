var Sold = require("sold")
Sold(__dirname)
  .data({
    version: require("moonjs").version
  })
  .engine("ejs")
  .template("template")
  .source("src")
  .destination("build")
  .build();
