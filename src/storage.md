---
title: Storage
order: 6
---

The storage driver provides access to local storage to persist data in the browser.

## Input

The storage driver provides the `window.localStorage` object.

```play
Moon.use({
	storage: Moon.storage.driver
});

Moon.run(({ storage }) => {
	console.log(storage);
	return {};
});
```

## Output

The storage driver accepts an object mapping keys to string values. It will replace all key/value pairs in the current local storage by diffing the new values with the current ones.

```play
Moon.use({
	storage: Moon.storage.driver
});

Moon.run(() => ({
	storage: {
		moon: "Titan",
		foo: "bar"
	}
}));

Moon.run(() => ({
	storage: {
		moon: "Europa"
	}
}));
```
