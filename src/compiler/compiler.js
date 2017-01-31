var compile = function(template) {
  var tokens = lex(template);
  var ast = parse(tokens);
  return generate(ast);
}
