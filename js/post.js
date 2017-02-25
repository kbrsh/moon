var sidebarToggle = document.getElementById("sidebar-toggle");

sidebarToggle.addEventListener("click", function() {
  document.body.classList.toggle("close");
});

var code = document.getElementsByTagName("code");

var compile = function(val) {
  var compiled = val;

  var STR_RE = /["'](.*?)["']/g;
  var SPECIAL_RE = /\b(new|var|if|do|function|while|switch|for|foreach|in|continue|break)(?=[^\w])/g;
  var GLOBAL_VARIABLE_RE = /\b(document|window|Array|String|Object|Number|\$)(?=[^\w])/g;
  var METHODS_RE = /\b(indexOf|match|replace|toString|length)(?=[^\w])/g;
  var MULTILINE_COMMENT_RE  = /(\/\*.*\*\/)/g;
  var COMMENT_RE = /(\/\/.*)/g;

  var TAG_RE = /(&lt;(.|\n)*?&gt;)/g;

  compiled.replace(STR_RE, function(match, value) {
    compiled = compiled.replace(match, "<span class=\"string\">\"" + value + "\"</span>");
  });

  compiled.replace(SPECIAL_RE, function(match, value) {
    compiled = compiled.replace(match, "<span class=\"special\">" + value + "</span>");
  });

  compiled.replace(GLOBAL_VARIABLE_RE, function(match, value) {
    compiled = compiled.replace(match, "<span class=\"global\">" + value + "</span>");
  });

  compiled.replace(METHODS_RE, function(match, value) {
    compiled = compiled.replace(match, "<span class=\"method\">" + value + "</span>");
  });

  compiled.replace(COMMENT_RE, function(match, value) {
    compiled = compiled.replace(match, "<span class=\"comment\">" + value + "</span>");
  });

  compiled.replace(MULTILINE_COMMENT_RE, function(match, value) {
    compiled = compiled.replace(match, "<span class=\"comment\">" + value + "</span>");
  });

  compiled.replace(TAG_RE, function(match, value) {
    compiled = compiled.replace(new RegExp(match, "g"), "<span class=\"tag\">" + value + "</span>");
  });


  return compiled;
}

for(var i = 0; i < code.length; i++) {
  var el = code[i];
  var attrs = Array.prototype.slice.call(el.attributes);
  for(var j = 0; j < attrs.length; j++) {
    var type = attrs[j].name;
    var val = attrs[j].value;
    if(type === "class" && val.substr(0, 5) === "lang-") {
      var lang = val.slice(5);
      el.setAttribute('lang', lang);
      el.classList.remove(val);
    }
    el.innerHTML = compile(el.innerHTML);
  }
}
