const compile = function(template) {
  const tokens = lex(template);
  const ast = parse(tokens);
  return generate(ast);
}
