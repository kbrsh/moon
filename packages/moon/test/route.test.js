import Moon from "moon/src/index";
const m = Moon.m;

test("provides route as input", () => {
	expect(m.route).toEqual("/");
});

test("changes route for output", () => {
	expect(m.route).toEqual("/");
	m.route = "/test";
	expect(m.route).toEqual("/test");
	m.route = "/test/foo";
	expect(m.route).toEqual("/test/foo");
});

test("router view", () => {
	const view = route => data => <Moon.view.components.p>{route}{data.route}{data.test}</Moon.view.components.p>;
	const data = route => ({ route, test: "test-moon-route" });
	const routes = {
		"/": [view("/"), {}],
		"/foo": [view("/foo"), {
			"/bar": [view("/foo/bar"), {}],
			"/baz": [view("/foo/baz"), {}],
			"/*": [view("/foo/*"), {
				"/test": [view("/foo/*/test"), {}]
			}]
		}],
		"/*": [view("/*"), {}]
	};

	expect(<Moon.route.router test="test-moon-route" route="/" routes=routes/>).toEqual(view("/")(data("/")));
	expect(<Moon.route.router test="test-moon-route" route="/foo" routes=routes/>).toEqual(view("/foo")(data("/foo")));
	expect(<Moon.route.router test="test-moon-route" route="/foo/bar" routes=routes/>).toEqual(view("/foo/bar")(data("/foo/bar")));
	expect(<Moon.route.router test="test-moon-route" route="/foo/baz" routes=routes/>).toEqual(view("/foo/baz")(data("/foo/baz")));
	expect(<Moon.route.router test="test-moon-route" route="/unknown" routes=routes/>).toEqual(view("/*")(data("/unknown")));
	expect(<Moon.route.router test="test-moon-route" route="/foo/unknown" routes=routes/>).toEqual(view("/foo/*")(data("/foo/unknown")));
	expect(<Moon.route.router test="test-moon-route" route="/foo/unknown/test" routes=routes/>).toEqual(view("/foo/*/test")(data("/foo/unknown/test")));
});
