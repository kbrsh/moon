import compile from "moon-compiler/src/index";

function assertGenerate(input, output) {
	expect(compile(input)).toEqual(output);
}

test("generate static element", () => {
	assertGenerate(
		"(<div><h1>Test</h1><p>test</p></div>)",
		"var m0;((function(){if(m0===undefined){m0=Moon.view.m(0,\"div\",{},[Moon.view.m(0,\"h1\",{},[Moon.view.m(1,\"text\",{\"\":\"Test\"},[])]),Moon.view.m(0,\"p\",{},[Moon.view.m(1,\"text\",{\"\":\"test\"},[])])]);}return m0;})())"
	);
});

test("generate dynamic element", () => {
	assertGenerate(
		"(<div><h1>Test</h1><p>test {message}</p></div>)",
		"var m0,m1,m2,m3;((function(){if(m0===undefined){m0=[];m1=Moon.view.m(1,\"text\",{\"\":\"test \"},[]);m2={};m3=Moon.view.m(0,\"h1\",{},[Moon.view.m(1,\"text\",{\"\":\"Test\"},[])]);}return Moon.view.m(0,\"div\",m2,[m3,Moon.view.m(0,\"p\",m2,[m1,Moon.view.m(1,\"text\",{\"\":message},m0)])]);})())"
	);
});

test("generate static attributes", () => {
	assertGenerate(
		"(<div><h1 id='bar' class='foo'>Test</h1><p>test {message}</p></div>)",
		"var m0,m1,m2,m3;((function(){if(m0===undefined){m0=[];m1=Moon.view.m(1,\"text\",{\"\":\"test \"},[]);m2={};m3=Moon.view.m(0,\"h1\",{\"id\":'bar',\"className\":'foo'},[Moon.view.m(1,\"text\",{\"\":\"Test\"},[])]);}return Moon.view.m(0,\"div\",m2,[m3,Moon.view.m(0,\"p\",m2,[m1,Moon.view.m(1,\"text\",{\"\":message},m0)])]);})())"
	);
});

test("generate dynamic attributes", () => {
	assertGenerate(
		"(<div><h1 id='bar' class={foo}>Test</h1><p>test {message}</p></div>)",
		"var m0,m1,m2,m3;((function(){if(m0===undefined){m0=[Moon.view.m(1,\"text\",{\"\":\"Test\"},[])];m1=[];m2=Moon.view.m(1,\"text\",{\"\":\"test \"},[]);m3={};}return Moon.view.m(0,\"div\",m3,[Moon.view.m(0,\"h1\",{\"id\":'bar',\"className\":foo},m0),Moon.view.m(0,\"p\",m3,[m2,Moon.view.m(1,\"text\",{\"\":message},m1)])]);})())"
	);
});

test("generate dynamic data attribute", () => {
	assertGenerate(
		"(<div foo={bar} bar={data}></div>)",
		"var m0;((function(){if(m0===undefined){m0=[];}return Moon.view.m(0,\"div\",{\"foo\":bar,\"bar\":data},m0);})())"
	);
});

test("generate static children attribute", () => {
	assertGenerate(
		"(<div foo={bar} children='fake'></div>)",
		"var m0;((function(){if(m0===undefined){m0='fake';}return Moon.view.m(0,\"div\",{\"foo\":bar},m0);})())"
	);
});

test("generate dynamic children attribute", () => {
	assertGenerate(
		"(<div children={children}></div>)",
		"var m0;((function(){if(m0===undefined){m0={};}return Moon.view.m(0,\"div\",m0,children);})())"
	);
});

test("generate events", () => {
	assertGenerate(
		"(<div><h1 id='bar' class={foo} @click={doSomething}>Test</h1><p>test {message}</p></div>)",
		"var m0,m1,m2,m3;((function(){if(m0===undefined){m0=[Moon.view.m(1,\"text\",{\"\":\"Test\"},[])];m1=[];m2=Moon.view.m(1,\"text\",{\"\":\"test \"},[]);m3={};}return Moon.view.m(0,\"div\",m3,[Moon.view.m(0,\"h1\",{\"id\":'bar',\"className\":foo,\"@click\":doSomething},m0),Moon.view.m(0,\"p\",m3,[m2,Moon.view.m(1,\"text\",{\"\":message},m1)])]);})())"
	);
});

test("generate static components", () => {
	assertGenerate(
		"(<div><Component/></div>)",
		"var m0;((function(){if(m0===undefined){m0=Moon.view.m(0,\"div\",{},[Component({children:[]})]);}return m0;})())"
	);
});

test("generate static components with data", () => {
	assertGenerate(
		"(<div><Component foo='bar' bar='baz'/></div>)",
		"var m0;((function(){if(m0===undefined){m0=Moon.view.m(0,\"div\",{},[Component({\"foo\":'bar',\"bar\":'baz',children:[]})]);}return m0;})())"
	);
});

test("generate static components with children", () => {
	assertGenerate(
		"(<div><Component foo='bar' bar='baz'><p>static</p></Component></div>)",
		"var m0;((function(){if(m0===undefined){m0=Moon.view.m(0,\"div\",{},[Component({\"foo\":'bar',\"bar\":'baz',children:[Moon.view.m(0,\"p\",{},[Moon.view.m(1,\"text\",{\"\":\"static\"},[])])]})]);}return m0;})())"
	);
});

test("generate dynamic components with data", () => {
	assertGenerate(
		"(<div><Component foo={bar} bar='baz'/></div>)",
		"var m0,m1;((function(){if(m0===undefined){m0=[];m1={};}return Moon.view.m(0,\"div\",m1,[Component({\"foo\":bar,\"bar\":'baz',children:m0})]);})())"
	);
});

test("generate dynamic components with children", () => {
	assertGenerate(
		"(<div><Component foo={bar} bar='baz'><p>{message}</p></Component></div>)",
		"var m0,m1;((function(){if(m0===undefined){m0=[];m1={};}return Moon.view.m(0,\"div\",m1,[Component({\"foo\":bar,\"bar\":'baz',children:[Moon.view.m(0,\"p\",m1,[Moon.view.m(1,\"text\",{\"\":message},m0)])]})]);})())"
	);
});

test("generate text directly", () => {
	assertGenerate(
		"(<text={foo}/>)",
		"var m0;((function(){if(m0===undefined){m0=[];}return Moon.view.m(1,\"text\",{\"\":foo},m0);})())"
	);
});

test("generate static element nodes", () => {
	assertGenerate(
		"(<element name='h1' data='fake data' children='fake children'/>)",
		"var m0;((function(){if(m0===undefined){m0=Moon.view.m(0,'h1','fake data','fake children');}return m0;})())"
	);
});

test("generate static data element nodes", () => {
	assertGenerate(
		"(<element name='h1' data='static' children={dynamic}/>)",
		"((function(){return Moon.view.m(0,'h1','static',dynamic);})())"
	);
});

test("generate static children element nodes", () => {
	assertGenerate(
		"(<element name='h1' data={{dynamic: dynamic}} children={[]}/>)",
		"((function(){return Moon.view.m(0,'h1',{dynamic: dynamic},[]);})())"
	);
});

test("generate dynamic element nodes", () => {
	assertGenerate(
		"(<element name='h1' data={dynamic} children={dynamicChildren}/>)",
		"((function(){return Moon.view.m(0,'h1',dynamic,dynamicChildren);})())"
	);
});

test("generate if node", () => {
	assertGenerate(
		"(<div><if={condition}><p>test</p></if></div>)",
		"var m0,m1,m2,m3;((function(){if(m1===undefined){m1=Moon.view.m(0,\"p\",{},[Moon.view.m(1,\"text\",{\"\":\"test\"},[])]);m2=Moon.view.m(1,\"text\",{\"\":\"\"},[]);m3={};}if(condition){m0=m1;}else{m0=m2;}return Moon.view.m(0,\"div\",m3,[m0]);})())"
	);
});

test("generate if node at root", () => {
	assertGenerate(
		"(<if={condition}><p>test</p></if>)",
		"var m0,m1,m2;((function(){if(m1===undefined){m1=Moon.view.m(0,\"p\",{},[Moon.view.m(1,\"text\",{\"\":\"test\"},[])]);m2=Moon.view.m(1,\"text\",{\"\":\"\"},[]);}if(condition){m0=m1;}else{m0=m2;}return m0;})())"
	);
});

test("generate if/else node", () => {
	assertGenerate(
		"(<div><if={condition}><p>test</p></if><else>{dynamic}</else></div>)",
		"var m0,m1,m2,m3;((function(){if(m1===undefined){m1=Moon.view.m(0,\"p\",{},[Moon.view.m(1,\"text\",{\"\":\"test\"},[])]);m2=[];m3={};}if(condition){m0=m1;}else{m0=Moon.view.m(1,\"text\",{\"\":dynamic},m2);}return Moon.view.m(0,\"div\",m3,[m0]);})())"
	);
});

test("generate if/else-if node", () => {
	assertGenerate(
		"(<div><if={condition}><p>test</p></if><else-if={condition2}><h3>Dynamic: {dynamic}</h3></else-if></div>)",
		"var m0,m1,m2,m3,m4,m5;((function(){if(m1===undefined){m1=Moon.view.m(0,\"p\",{},[Moon.view.m(1,\"text\",{\"\":\"test\"},[])]);m2=[];m3=Moon.view.m(1,\"text\",{\"\":\"Dynamic: \"},[]);m4={};m5=Moon.view.m(1,\"text\",{\"\":\"\"},[]);}if(condition){m0=m1;}else if(condition2){m0=Moon.view.m(0,\"h3\",m4,[m3,Moon.view.m(1,\"text\",{\"\":dynamic},m2)]);}else{m0=m5;}return Moon.view.m(0,\"div\",m4,[m0]);})())"
	);
});

test("generate if/else-if/else node", () => {
	assertGenerate(
		"(<div><if={condition}><p>test</p></if><else-if={condition2}><h3>Dynamic: {dynamic}</h3></else-if><else>{dynamic}</else><h5>Ending</h5></div>)",
		"var m0,m1,m2,m3,m4,m5;((function(){if(m1===undefined){m1=Moon.view.m(0,\"p\",{},[Moon.view.m(1,\"text\",{\"\":\"test\"},[])]);m2=[];m3=Moon.view.m(1,\"text\",{\"\":\"Dynamic: \"},[]);m4={};m5=Moon.view.m(0,\"h5\",{},[Moon.view.m(1,\"text\",{\"\":\"Ending\"},[])]);}if(condition){m0=m1;}else if(condition2){m0=Moon.view.m(0,\"h3\",m4,[m3,Moon.view.m(1,\"text\",{\"\":dynamic},m2)]);}else{m0=Moon.view.m(1,\"text\",{\"\":dynamic},m2);}return Moon.view.m(0,\"div\",m4,[m0,m5]);})())"
	);
});

test("generate nested if/else-if/else node", () => {
	assertGenerate(
		"(<div><if={condition}><p><if={condition}><if={nested}><p>test</p></if></if><else-if={condition2}><h3>Dynamic: {dynamic}</h3></else-if><else>{dynamic}</else></p></if><else-if={condition2}><h3>Dynamic: {dynamic} <if={condition}><p>test</p></if><else-if={condition2}><h3>Dynamic: {dynamic}</h3></else-if><else>{dynamic}</else></h3></else-if><else>{dynamic} <if={condition}><p>test</p></if><else-if={condition2}><h3>Dynamic: {dynamic}</h3></else-if><else>{dynamic}</else></else></div>)",
		"var m0,m1,m2,m3,m4,m5,m6,m7,m8;((function(){if(m3===undefined){m3=Moon.view.m(0,\"p\",{},[Moon.view.m(1,\"text\",{\"\":\"test\"},[])]);m4=Moon.view.m(1,\"text\",{\"\":\"\"},[]);m5=[];m6=Moon.view.m(1,\"text\",{\"\":\"Dynamic: \"},[]);m7={};}if(condition){if(condition){if(nested){m2=m3;}else{m2=m4;}m1=m2;}else if(condition2){m1=Moon.view.m(0,\"h3\",m7,[m6,Moon.view.m(1,\"text\",{\"\":dynamic},m5)]);}else{m1=Moon.view.m(1,\"text\",{\"\":dynamic},m5);}m0=Moon.view.m(0,\"p\",m7,[m1]);}else if(condition2){if(condition){m8=m3;}else if(condition2){m8=Moon.view.m(0,\"h3\",m7,[m6,Moon.view.m(1,\"text\",{\"\":dynamic},m5)]);}else{m8=Moon.view.m(1,\"text\",{\"\":dynamic},m5);}m0=Moon.view.m(0,\"h3\",m7,[m6,Moon.view.m(1,\"text\",{\"\":dynamic},m5),m8]);}else{m0=Moon.view.m(1,\"text\",{\"\":dynamic},m5);}return Moon.view.m(0,\"div\",m7,[m0]);})())"
	);
});

test("generate static for-of node", () => {
	assertGenerate(
		"(<for={item} of={list}><p>test</p></for>)",
		"var m0,m1,m2,m3,m4;((function(){if(m3===undefined){m3=Moon.view.m(0,\"p\",{},[Moon.view.m(1,\"text\",{\"\":\"test\"},[])]);m4={};}m0=[];m1=function(item){return m3;};for(m2=0;m2<list.length;m2++){m0.push(m1(list[m2],m2));}return Moon.view.m(0,\"span\",m4,m0);})())"
	);
});

test("generate for-of node", () => {
	assertGenerate(
		"(<for={item} of={list}><p>{item}</p></for>)",
		"var m0,m1,m2,m3,m4;((function(){if(m3===undefined){m3=[];m4={};}m0=[];m1=function(item){return Moon.view.m(0,\"p\",m4,[Moon.view.m(1,\"text\",{\"\":item},m3)]);};for(m2=0;m2<list.length;m2++){m0.push(m1(list[m2],m2));}return Moon.view.m(0,\"span\",m4,m0);})())"
	);
});

test("generate for-of node with index", () => {
	assertGenerate(
		"(<for={item,index} of={list}><p>{item} {index}</p></for>)",
		"var m0,m1,m2,m3,m4;((function(){if(m3===undefined){m3=[];m4={};}m0=[];m1=function(item,index){return Moon.view.m(0,\"p\",m4,[Moon.view.m(1,\"text\",{\"\":item},m3),Moon.view.m(1,\"text\",{\"\":index},m3)]);};for(m2=0;m2<list.length;m2++){m0.push(m1(list[m2],m2));}return Moon.view.m(0,\"span\",m4,m0);})())"
	);
});

test("generate static for-in node", () => {
	assertGenerate(
		"(<for={key} in={obj}><p>test</p></for>)",
		"var m0,m1,m2,m3,m4;((function(){if(m3===undefined){m3=Moon.view.m(0,\"p\",{},[Moon.view.m(1,\"text\",{\"\":\"test\"},[])]);m4={};}m0=[];m1=function(key){return m3;};for(m2 in obj){m0.push(m1(m2,obj[m2]));}return Moon.view.m(0,\"span\",m4,m0);})())"
	);
});

test("generate for-in node", () => {
	assertGenerate(
		"(<for={key} in={obj}><p>{key}</p></for>)",
		"var m0,m1,m2,m3,m4;((function(){if(m3===undefined){m3=[];m4={};}m0=[];m1=function(key){return Moon.view.m(0,\"p\",m4,[Moon.view.m(1,\"text\",{\"\":key},m3)]);};for(m2 in obj){m0.push(m1(m2,obj[m2]));}return Moon.view.m(0,\"span\",m4,m0);})())"
	);
});

test("generate for-in node with value", () => {
	assertGenerate(
		"(<for={key,value} in={obj}><p>{key} {value}</p></for>)",
		"var m0,m1,m2,m3,m4;((function(){if(m3===undefined){m3=[];m4={};}m0=[];m1=function(key,value){return Moon.view.m(0,\"p\",m4,[Moon.view.m(1,\"text\",{\"\":key},m3),Moon.view.m(1,\"text\",{\"\":value},m3)]);};for(m2 in obj){m0.push(m1(m2,obj[m2]));}return Moon.view.m(0,\"span\",m4,m0);})())"
	);
});

test("generate nested for nodes", () => {
	assertGenerate(
		"(<for={item,index} of={list}><for={key,value} in={item}><p>{item} {index} {key} {value}</p></for></for>)",
		"var m0,m1,m2,m3,m4,m5,m6,m7;((function(){if(m6===undefined){m6=[];m7={};}m0=[];m1=function(item,index){m3=[];m4=function(key,value){return Moon.view.m(0,\"p\",m7,[Moon.view.m(1,\"text\",{\"\":item},m6),Moon.view.m(1,\"text\",{\"\":index},m6),Moon.view.m(1,\"text\",{\"\":key},m6),Moon.view.m(1,\"text\",{\"\":value},m6)]);};for(m5 in item){m3.push(m4(m5,item[m5]));}return Moon.view.m(0,\"span\",m7,m3);};for(m2=0;m2<list.length;m2++){m0.push(m1(list[m2],m2));}return Moon.view.m(0,\"span\",m7,m0);})())"
	);
});

test("generate for node with static custom element", () => {
	assertGenerate(
		"(<for={item,index} of={list} name='h1' data={{ custom: true }}><p>{item} {index}</p></for>)",
		"var m0,m1,m2,m3,m4;((function(){if(m3===undefined){m3=[];m4={};}m0=[];m1=function(item,index){return Moon.view.m(0,\"p\",m4,[Moon.view.m(1,\"text\",{\"\":item},m3),Moon.view.m(1,\"text\",{\"\":index},m3)]);};for(m2=0;m2<list.length;m2++){m0.push(m1(list[m2],m2));}return Moon.view.m(0,'h1',{ custom: true },m0);})())"
	);
});

test("generate for node with dynamic custom element", () => {
	assertGenerate(
		"(<for={item,index} of={list} name='h1' data={{ custom: dynamic }}><p>{item} {index}</p></for>)",
		"var m0,m1,m2,m3,m4;((function(){if(m3===undefined){m3=[];m4={};}m0=[];m1=function(item,index){return Moon.view.m(0,\"p\",m4,[Moon.view.m(1,\"text\",{\"\":item},m3),Moon.view.m(1,\"text\",{\"\":index},m3)]);};for(m2=0;m2<list.length;m2++){m0.push(m1(list[m2],m2));}return Moon.view.m(0,'h1',{ custom: dynamic },m0);})())"
	);
});

test("generate for node with duplicate local", () => {
	assertGenerate(
		"(<for={item} of={list}><for={item} of={list}><for={window} of={list}><for={not: 'foo'} of={list}>{item}</for></for></for></for>)",
		"var m0,m1,m2,m3,m4,m5,m6,m7,m8,m9,m10,m11,m12,m13;((function(){if(m12===undefined){m12=[];m13={};}m0=[];m1=function(item){m3=[];m4=function(item){m6=[];m7=function(window){m9=[];m10=function(not: 'foo'){return Moon.view.m(1,\"text\",{\"\":item},m12);};for(m11=0;m11<list.length;m11++){m9.push(m10(list[m11],m11));}return Moon.view.m(0,\"span\",m13,m9);};for(m8=0;m8<list.length;m8++){m6.push(m7(list[m8],m8));}return Moon.view.m(0,\"span\",m13,m6);};for(m5=0;m5<list.length;m5++){m3.push(m4(list[m5],m5));}return Moon.view.m(0,\"span\",m13,m3);};for(m2=0;m2<list.length;m2++){m0.push(m1(list[m2],m2));}return Moon.view.m(0,\"span\",m13,m0);})())"
	);
});

test("generate with comments", () => {
	const code = `// (<h1>not converted</h1>)\n`;
	assertGenerate(code, code);
});

test("generate with multiline comments", () => {
	const code = `/*\n(<h1>not converted</h1>)\n*/`;
	assertGenerate(code, code);
});

test("generate with double quote strings", () => {
	const code = `"(<h1>not converted</h1>)"`;
	assertGenerate(code, code);
});

test("generate with single quote strings", () => {
	const code = `'(<h1>not converted</h1>)'`;
	assertGenerate(code, code);
});

test("generate with template strings", () => {
	const code = "`(<h1>not converted</h1>)`";
	assertGenerate(code, code);
});

test("generate other expressions", () => {
	const code = "(1 + 1)";
	assertGenerate(code, code);
});

test("generate other complex nested expressions", () => {
	const code = "(1 + ('hello\'' + `world\\\"`))";
	assertGenerate(code, code);
});

test("generate other complex nested expressions inside views", () => {
	assertGenerate(
		"(<h1 test={(1 + ('hello\\'' + `world\\\"`))}>Test</h1>)",
		"var m0;((function(){if(m0===undefined){m0=Moon.view.m(0,\"h1\",{\"test\":(1 + ('hello\\'' + `world\\\"`))},[Moon.view.m(1,\"text\",{\"\":\"Test\"},[])]);}return m0;})())"
	);
});

test("generate views with surrounding whitespace", () => {
	assertGenerate(
		`(
			<p>Moon</p>
		)`,
		"var m0;(\n\t\t\t(function(){if(m0===undefined){m0=Moon.view.m(0,\"p\",{},[Moon.view.m(1,\"text\",{\"\":\"Moon\"},[])]);}return m0;})())"
	);
});
