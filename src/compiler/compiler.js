const compile = function(template) {
  const tokens = lex(template);
  const tree = parse(tokens);
  return generate(tree);
}
