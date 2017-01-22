var generateEl = function(el) {
	var code = "";
	for(var i = 0; i < el.children.length; i++) {
  	var child = el.children[i];
    var c;
    if(child.children) {
      c = generateEl(child);
    }
  	code += `h("${child.type}", "${JSON.stringify(child.props)}", ${JSON.stringify(c)})`;
  }
  return code;
}

var generate = function(ast) {
  var TEMPLATE_RE = /{{([A-Za-z0-9_.()\[\]]+)}}/gi;
  var code = "return " + generateEl(ast);
  code.replace(TEMPLATE_RE, function(match, key) {
    code = code.replace(match, '" + data["' + key + '"] + "');
  });
  return new Function("h", code)
}

var l = generate({
  type: 'root',
  props: {

  },
  children: [
    {
      type: "h1",
      props: {

      },
      children: [
        {
          type: "#text",
          props: {

          },
          children: ['Hello']
        }
      ]
    }
  ]
});
console.log(l(h))
