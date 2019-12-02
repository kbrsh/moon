/* Start Moon Source */
/* End Moon Source */

function Node() {}

var console = {
	log: function() {},
	error: function() {}
};

var Date = {
	now: function() {
		return 0;
	}
};

function requestAnimationFrame(fn) {
	fn();
}

function element(parent) {
	return {
		tagName: "DIV",
		attributes: [{name: "id", value: "test"}],
		parentNode: parent === undefined ? element(true) : {},
		appendChild: function() {},
		removeChild: function() {},
		replaceChild: function() {}
	};
}

var document = {
	querySelector: function() {
		return element();
	},
	createElement: function() {
		return element();
	},
	createTextNode: function() {
		return element();
	}
};

var list = [];

function Item(data) {
	var item = data.item;

	return Moon.view.m.p({ class: item, children: [ Moon.view.m.text({ value: item }) ] });
}

function View(data) {
	var list = data.list;
	var items = [];

	for (var i = 0; i < list.length; i++) {
		items.push(Item({ item: list[i].toString() }));
	}

	return Moon.view.m.span({ children: items });
}

Moon.use({
	view: Moon.view.driver("#root")
});

Moon.run(() => ({
	view: View({ list: [1, 2, 3] })
}));

for (var i = 0; i < 1000; i++) {
	list = list.concat([7]);
	Moon.run(() => ({
		view: View({ list: list })
	}));
}
