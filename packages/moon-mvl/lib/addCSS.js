module.exports = (code) => {
	const head = document.querySelector("head");
	const style = document.createElement("style");
	style.appendChild(document.createTextNode(code));
	head.appendChild(style);

	return () => {
		head.removeChild(style);
	};
};
