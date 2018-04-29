import { mapReduce } from "./util";
import { generateCreate } from "./create";
import { generateMount } from "./mount";
import { generateUpdate } from "./update";

export const generate = (tree) => {
  return new Function(`return [function () {var m = this.m;${generateCreate(tree)}}, function (root) {var m = this.m;${generateMount(tree, "root")}}, function () {var m = this.m;${mapReduce(tree.dependencies, (dependency) => `var ${dependency} = this.data.${dependency};`)}${generateUpdate(tree)}}]`)();
};
