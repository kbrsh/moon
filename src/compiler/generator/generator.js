import { mapReduce } from "./util";
import { generateCreate } from "./create";
import { generateUpdate } from "./update";

export const generate = (tree) => {
  const prelude = "var m=this.m;" + mapReduce(tree.dependencies, (dependency) => `var ${dependency}=this.data.${dependency};`);
  return new Function(`return [function(root){${prelude}${generateCreate(tree, "root")}},function(){${prelude}${generateUpdate(tree)}}]`)();
};
