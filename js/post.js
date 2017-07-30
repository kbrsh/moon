docsearch({
  apiKey: '7710c47b3b47d4ee65253d66582eccb1',
  indexName: 'moonjs',
  inputSelector: '#search',
  debug: false
});

var STR_RE = /(["'`])((?:.|\n)*?)\1/g;
var SPECIAL_RE = /\b(new|var|let|if|do|function|while|switch|for|foreach|in|continue|break|return)(?=[^\w])/g;
var GLOBAL_VARIABLE_RE = /\b(document|window|Array|String|true|false|Object|this|Boolean|Function|Number|\d|\$)/g;
var CONST_RE = /\b(const )([\w\d]+)/g;
var METHODS_RE = /\b([\w\d]+)(\((?:.|\n)*?\))/g;
var MULTILINE_COMMENT_RE  = /(\/\*.*\*\/)/g;
var COMMENT_RE = /(\/\/.*)/g;
var HTML_COMMENT_RE = /(\&lt;\!\-\-(?:(?:.|\n)*)\-\-\&gt;)/g;
var HTML_ATTRIBUTE_RE = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g;
var HTML_TAG_RE = /(&lt;\/?[\w\d-]*?)(\s(?:.|\n)*?)?(\/?&gt;)/g;

var sidebarToggle = document.getElementById("sidebar-toggle");

sidebarToggle.addEventListener("click", function() {
  document.body.classList.toggle("close");
});

var code = document.getElementsByTagName("code");

var compile = function(val, lang) {
  var compiled = val;

  compiled = compiled.replace(STR_RE, "<span class=\"string\">$1$2$1</span>");

  if(lang === "html") {
    compiled = compiled.replace(HTML_COMMENT_RE, "<span class=\"comment\">$1</span>");
    compiled = compiled.replace(HTML_TAG_RE, function(match, start, content, end) {
      if(content === undefined) {
        content = "";
      } else {
        content = content.replace(HTML_ATTRIBUTE_RE, function(match, name, value) {
          if(value === "string") {
            return match;
          } else {
            if(value === undefined) {
              value = "";
            } else {
              value = "=" + value;
            }
            return "<span class=\"global\">" + name + "</span>" + value;
          }
        });
      }

      return "<span class=\"method\">" + start + "</span>" + content + "<span class=\"method\">" + end + "</span>";
    });
  } else {
    compiled = compiled.replace(SPECIAL_RE, "<span class=\"special\">$1</span>");
    compiled = compiled.replace(GLOBAL_VARIABLE_RE, "<span class=\"global\">$1</span>");

    compiled = compiled.replace(CONST_RE, "<span class=\"special\">$1</span><span class=\"global\">$2</span>");
    compiled = compiled.replace(METHODS_RE, function(match, name, params) {
      if(params === undefined) {
        params = "";
      }

      if(name !== "function") {
        return "<span class=\"method\">" + name + "</span>" + params;
      } else {
        return match;
      }
    });

    compiled = compiled.replace(COMMENT_RE, "<span class=\"comment\">$1</span>");
    compiled = compiled.replace(MULTILINE_COMMENT_RE, "<span class=\"comment\">$1</span>");
  }


  return compiled;
}

for(var i = 0; i < code.length; i++) {
  var el = code[i];
  if(el.getAttribute("data-nohighlight")) {
    continue;
  }
  var attrs = Array.prototype.slice.call(el.attributes);
  for(var j = 0; j < attrs.length; j++) {
    var type = attrs[j].name;
    var val = attrs[j].value;
    var lang;
    if(type === "class" && val.substr(0, 5) === "lang-") {
      lang = val.slice(5);
      el.setAttribute('lang', lang);
      el.classList.remove(val);
    }
    el.innerHTML = compile(el.innerHTML, lang);
  }
  if(!attrs.length) {
    el.innerHTML = compile(el.innerHTML, 'js');
  }
}
