---
title: HTTP
order: 7
---

The HTTP driver allows sending and receiving HTTP requests and responses.

## Input

The HTTP driver provides the latest HTTP response as input. The response will have the `status` code, `headers`, and `body`.

```play
Moon.use({
	http: Moon.http.driver
});

Moon.run(({ http }) => {
	console.log(http); // => null
	return {
		http: [{
			url: "https://moonjs.org/"
		}]
	};
});

Moon.run(({ http }) => {
	console.log(http); // => { status, headers, body }
	return {};
});
```

## Output

The HTTP driver accepts a list of HTTP requests as output. Each request can have a `method`, `url`, `headers`, `body`, `responseType`, `onLoad`, and `onError` property. Only the `url` property is required.

```play
Moon.use({
	http: Moon.http.driver
});

Moon.run(() => ({
	http: [
		{
			url: "https://moonjs.org/",
			onLoad: ({ http }) => {
				console.log(http);
				return {};
			}
		},
		{
			method: "GET",
			url: "https://moonjs.org/",
			headers: {
				"Moon": "Titan"
			},
			body: "HTTP driver test",
			responseType: "document",
			onLoad: ({ http }) => {
				console.log(http);
				return {};
			},
			onError: ({ http }) => {
				console.error(http);
				return {};
			}
		}
	]
}));
```
