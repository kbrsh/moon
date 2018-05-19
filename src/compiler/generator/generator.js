import { removeChild, mapReduce } from "./util";
import { generateCreate } from "./create";
import { generateMount } from "./mount";
import { generateUpdate } from "./update";

export const generate = (tree) => {
  return new Function(`return [function(m){this.m[0]=m;m=this.m;${mapReduce(tree.children, (child) => generateCreate(child, tree, tree))}${mapReduce(tree.children, (child) => generateMount(child, tree, tree))}},function(){var m=this.m;${mapReduce(tree.dependencies, (dependency) => `var ${dependency}=this.data.${dependency};`)}${mapReduce(tree.children, (child) => generateUpdate(child, tree, tree))}},function(){var m=this.m;${mapReduce(tree.children, (child) => removeChild(child.index, tree.index))}m=[m[0]];}];`)();
};
