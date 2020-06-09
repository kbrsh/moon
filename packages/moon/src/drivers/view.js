import { View, viewNodeCreate, viewDataCreate, viewDataUpdate, viewDataRemove } from "moon/src/wrappers/view";

/**
 * Root element
 */
let root = new View("div", {id: "moon-root"}, []);
const rootNode = document.getElementById("moon-root");
rootNode.MoonChildren = [];

/**
 * View driver
 */
export default {
	get() {
		return root;
	},
	set(view) {
		const viewNodes = [rootNode];
		const viewOlds = [root];
		const viewNews = [view];
		root = view;

		while (true) {
			const viewNode = viewNodes.pop();
			const viewOld = viewOlds.pop();
			const viewNew = viewNews.pop();

			if (viewOld !== viewNew) {
				const viewNewName = viewNew.name;

				if (viewOld.name !== viewNewName) {
					viewNode.parentNode.replaceChild(viewNodeCreate(viewNew), viewNode);
				} else {
					const viewOldData = viewOld.data;
					const viewOldChildren = viewOld.children;
					const viewNewData = viewNew.data;
					const viewNewChildren = viewNew.children;

					if (viewOldData !== viewNewData) {
						for (const key in viewNewData) {
							if (key in viewOldData) {
								const valueOld = viewOldData[key];
								const valueNew = viewNewData[key];

								if (valueOld !== valueNew) {
									viewDataUpdate(viewNode, key, valueOld, valueNew);
								}
							} else {
								viewDataCreate(viewNode, key, viewNewData[key]);
							}
						}

						for (const key in viewOldData) {
							if (!(key in viewNewData)) {
								viewDataRemove(viewNode, viewNewName, viewOldData, key);
							}
						}
					}

					if (viewOldChildren !== viewNewChildren) {
						const viewNodeChildren = viewNode.MoonChildren;
						const viewOldChildrenLength = viewOldChildren.length;
						const viewNewChildrenLength = viewNewChildren.length;
						let i = 0;

						if (viewOldChildrenLength === viewNewChildrenLength) {
							for (; i < viewOldChildrenLength; i++) {
								viewNodes.push(viewNodeChildren[i]);
								viewOlds.push(viewOldChildren[i]);
								viewNews.push(viewNewChildren[i]);
							}
						} else if (viewOldChildrenLength < viewNewChildrenLength) {
							for (; i < viewOldChildrenLength; i++) {
								viewNodes.push(viewNodeChildren[i]);
								viewOlds.push(viewOldChildren[i]);
								viewNews.push(viewNewChildren[i]);
							}

							for (; i < viewNewChildrenLength; i++) {
								viewNodeChildren.push(viewNode.appendChild(viewNodeCreate(viewNewChildren[i])));
							}
						} else {
							for (; i < viewNewChildrenLength; i++) {
								viewNodes.push(viewNodeChildren[i]);
								viewOlds.push(viewOldChildren[i]);
								viewNews.push(viewNewChildren[i]);
							}

							for (; i < viewOldChildrenLength; i++) {
								viewNode.removeChild(viewNodeChildren.pop());
							}
						}
					}
				}
			}

			if (viewOlds.length === 0) {
				break;
			}
		}
	}
};
