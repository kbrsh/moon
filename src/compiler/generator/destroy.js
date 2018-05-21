import { removeChild } from "./util";

export const generateDestroy = (element, parent, root) => removeChild(element.index, parent.index);
