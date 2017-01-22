var lex = function(input) {
  var current = 0;
  var tokens = [];
  var inTag = false;
  var tagNameFound = false;
  var WHITESPACE = /\s/;
  while (current < input.length) {
    var char = input[current];
    var next = input[current+1] || null;
    // Found Closing Tag Start
    if(char === "<" && next === "/") {
      tokens.push({
      	type: "closingTagStart",
        value: "CLOSE"
      });
      inTag = true;
      tagNameFound = false;
    	current+=2;
      continue;
    }
    // Found Opening Tag Start
    if(char === "<") {
    	tokens.push({
      	type: "tagStart",
        value: "<"
      });
      inTag = true;
      tagNameFound = false;
    	current++;
      continue;
    }
    // Found Tag End
    if(char === ">") {
    	tokens.push({
      	type: "tagEnd",
        value: ">"
      });
      inTag = false;
    	current++;
      continue;
    }
    // Found Text
    if(!inTag) {
    	tokens.push({
      	type: "text",
        value: char
      });
    	current++;
      continue;
    }
    // Found Tag Name, Extra Whitespace
    if(/\s/.test(char) && !tagNameFound) {
    	tagNameFound = true;
      current++;
      continue;
    }
    // Found Tag Name
    if(inTag && !tagNameFound) {
    	tokens.push({
      	type: "tagName",
        value: char
      });
    	current++;
      continue;
    }

    current++;
  }
  return tokens;
}


var html = "<h1>test</h1>";
p.innerHTML = JSON.stringify(lex(html), null, 2);
var lex = function(input) {
  var current = 0;
  var tokens = [];
  var inTag = false;
  var tagNameFound = false;
  var WHITESPACE = /\s/;
  while(current < input.length) {
    var char = input[current];
    var next = input[current+1] || null;
    if(char === "<" && next === "/") {
    	tokens.push({
      	type: "closeTagStart",
        value: "CLOSE"
      });
      inTag = true;
      current++;
      continue;
    }
    if(char === "<") {
    	tokens.push({
      	type: "tagStart",
        value: "<"
      });
      inTag = true;
      current++;
      continue;
    }
    if(char === ">") {
    	tokens.push({
      	type: "tagEnd",
        value: ">"
      });
      inTag = false;
      current++;
      continue;
    }
    if(inTag && !tagNameFound) {
    	var tag = "";
    	while(input[current] !== ">" || WHITESPACE.test(input[current])) {
      	tag += input[current];
        current++;
      }
      tokens.push({
      	type: "tagName",
        value: tag
      });
      continue;
    }
    if(!inTag) {
    	tokens.push({
      	type: "text",
        value: char
      });
    }
    current++;
  }
  return tokens;
}


var html = "<h1>test</h1>";
p.innerHTML = JSON.stringify(lex(html), null, 2);
console.log(lex(html))
