/* Start Moon Source */
/* End Moon Source */

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

Moon({
	root: "#root",
	view: `<for={$item} of={list}>{$item}</for>`,
	data: {list: [1, 2, 3]}
});

for (var i = 0; i < 10000; i++) {
	//Moon.set({ list: Moon.get.list.concat([7]) });
	Moon.set({ list: [] });
}
