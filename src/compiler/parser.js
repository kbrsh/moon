var parse = function(input) {
  var current = 0;
  var ast = {children: []};
  var WHITESPACE_RE = /\s/;
  while(current < input.length) {
    var char = input[current];
    var next = input[current+1] || null;
    if(char === "<") {
    	if(next === "/") {
      	current++;
        continue;
      }
    	current++;
    	var tag = "";
    	while(input[current] !== ">") {
      	tag += input[current];
        current++;
      }
      ast.children.push({type: tag});
      continue;
    }
    current++;
  }
  return ast;
}
