---
title: Data
order: 3
---

The data driver is a driver that handles persistent state. It stores data in memory and provides it as driver input. For output, it accepts new data that it stores and provides on any subsequent runs.

Stored data can have any type, but is usually an object with different properties for storing different parts of application state.

## Input

The data driver provides the current stored data as input.

```play
Moon.use({
	data: Moon.data.driver
});

Moon.run(({ data }) => {
	console.log(data); // => undefined
	return {
		data: "Titan"
	};
});

Moon.run(({ data }) => {
	console.log(data); // => "Titan"
	return {};
});
```

## Output

The data driver accepts new data as output and stores it. This is usually a completely new state to keep immutability and prevent bugs. However, the data can be mutated and returned again since the previous data is replaced with the new one.

```play
Moon.use({
	data: Moon.data.driver
});

Moon.run(() => ({
	data: {
		count: 1,
		name: "Titan"
	}
}));

Moon.run(({ data }) => ({
	data: {
		count: data.count + 1,
		name: "Europa"
	}
}));
```
