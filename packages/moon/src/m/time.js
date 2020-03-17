export default {
	get() {
		return Date.now();
	},
	set(input) {
		setTimeout(input[1], input[0] * 1000);
	}
};
