import { mapReduce } from "./util";
import { generateCreate } from "./create";
import { generateMount } from "./mount";
import { generateUpdate } from "./update";

export const generate = (tree) => {
  const prelude = "var m = this.m; " + mapReduce(tree.dependencies, (dependency) => `var ${dependency} = this.data.${dependency};`);
  return new Function(`return [function () {${prelude}${generateCreate(tree)}}, function (root) {var m = this.m;${generateMount(tree, "root")}}, function () {var m = this.m;${prelude}${generateUpdate(tree)}}]`)();
};
