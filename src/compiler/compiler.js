var compile = function(template) {
  var tokens = lex(input);
  var ast = parse(tokens);
  return generate(ast);
}
