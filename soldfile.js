var Sold = require("sold")
Sold(__dirname)
  .data({
    version: require("moonjs").version
  })
  .configHandlebars(function(Handlebars) {
    Handlebars.registerHelper('link', function(title, postFile, actualFile) {
      if (postFile == actualFile) {
        return new Handlebars.SafeString(`<a href="./${actualFile}" class="sidebar-link-active">${title}</a>`);
      }
      else {
        return new Handlebars.SafeString(`<a href="./${actualFile}">${title}</a>`);
      }
    });
  })
  .template("template")
  .source("src")
  .postSource("docs")
  .destination("")
  .build()
