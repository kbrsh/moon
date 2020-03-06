import ViewNode from "moon/src/view/ViewNode";
import { names } from "util/index";

/**
 * Components
 *
 * Each component generates a corresponding view node based on the data it is
 * passed as input. This data includes attributes and children.
 */
const components = {
	node: name => data => new ViewNode(name, data)
};

for (let i = 0; i < names.length; i++) {
	const name = names[i];
	components[name] = data => new ViewNode(name, data);
}

export default components;
