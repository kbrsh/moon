let components = [];

module.exports.register = (component) => {
	components.push(component);
};

module.exports.remove = () => {
	for (let i = 0; i < components.length; i++) {
		components[i].destroy();
	}

	components = [];
};
