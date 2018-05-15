import { mapReduce } from "./util";
import { generateCreate } from "./create";
import { generateUpdate } from "./update";

export const generate = (tree) => {
  return new Function(`return [function(root){var m=this.m;${generateCreate(tree, "root", tree)}},function(){var m=this.m;${mapReduce(tree.dependencies, (dependency) => `var ${dependency}=this.data.${dependency};`)}${generateUpdate(tree, tree)}}]`)();
};
