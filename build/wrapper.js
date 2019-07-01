(function(root, factory) {
	if (typeof module === "undefined") {
		root.MODULE_NAME = factory();
	} else {
		module.exports = factory();
	}
}(this, function() {
MODULE_CONTENT
}));
