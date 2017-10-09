const compile = function(template) {
  return generate(parse(lex(template)));
}
