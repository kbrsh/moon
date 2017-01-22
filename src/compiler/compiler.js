var compile = function(template) {
  var ast = parse(template);
  return generate(ast);
}
