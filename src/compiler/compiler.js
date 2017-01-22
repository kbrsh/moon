var compile = function(template) {
  var tokens = lex(tokens);
  var ast = parse(tokens);
  return generate(ast);
}
