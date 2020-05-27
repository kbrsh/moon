/**
 * Caches for performance
 */
Node.prototype.MoonName = null;
Node.prototype.MoonData = null;
Node.prototype.MoonReferences = null;

/**
 * Root element
 */
let root = document.getElementById("moon-root");
root.MoonName = "div";
root.MoonData = {
	id: "moon-root"
};

/**
 * View driver
 */
export default {
	get() {
		return root;
	},
	set(view) {
		root = view;
	}
};
