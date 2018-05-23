import { generateCreate } from "./create";
import { generateUpdate } from "./update";
import { generateDestroy } from "./destroy";
import { mapReduce } from "./util";

export const generate = (tree) => {
  const prelude = mapReduce(tree.dependencies, (dependency) => `var ${dependency}=this.data.${dependency};`);
  return new Function(`return [function(m){this.m[0]=m;m=this.m;${prelude}${mapReduce(tree.children, (child, index) => generateCreate(child, index, tree, tree))}},function(){var m=this.m;${prelude}${mapReduce(tree.children, (child, index) => generateUpdate(child, index, tree, tree))}},function(){var m=this.m;${mapReduce(tree.children, (child, index) => generateDestroy(child, index, tree, tree))}m=[m[0]];}];`)();
};
