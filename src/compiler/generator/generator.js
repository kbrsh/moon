import { generateCreate } from "./create";
import { generateUpdate } from "./update";
import { generateDestroy } from "./destroy";
import { mapReduce } from "./util";

export const generate = (tree) => {
  return new Function(`return [function(m){this.m[0]=m;m=this.m;var data=this.data;${mapReduce(tree.children, (child) => generateCreate(child, tree, tree))}},function(){var m=this.m;var data=this.data;${mapReduce(tree.children, (child) => generateUpdate(child, tree, tree))}},function(){var m=this.m;${mapReduce(tree.children, (child) => generateDestroy(child, tree, tree))}this.m=[m[0]];}];`)();
};
