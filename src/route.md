---
title: Route
order: 8
---

The route driver provides access to the pathname of the route in a browser.

## Router

The route module provides a router view that accepts a route and a map of routes to views and nested routes, rendering the view that matches the route while forwarding any data to the view.

```play
const p = Moon.view.m.p;
const router = Moon.route.router;

const view = route => data =>
	<p>
		The route is {route}.
		Provided data: {JSON.stringify(data)}.
	</p>;

const routes = {
	"/": [view("/"), {}],
	"/moon": [view("/moon"), {
		"/titan": [view("/moon/titan", {})],
		"/europa": [view("/moon/europa", {})],
		"/*": [view("/moon/*"), {}]
	}],
	"/*": [view("/*"), {}]
};

Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => ({
	// Use a hardcoded route. This can come from the route driver.
	view: <router route="/moon/titan" routes=routes foo="bar"/>
}));
```

## Input

The route driver provides the current pathname.

```play
Moon.use({
	route: Moon.route.driver
});

Moon.run(({ route }) => {
	console.log(route);
	return {};
});
```

## Output

The route driver accepts a new route that will be appended to the current history using `history.pushState`.

```js
Moon.use({
	route: Moon.route.driver
});

Moon.run(() => ({
	route: "/test"
}));
```
