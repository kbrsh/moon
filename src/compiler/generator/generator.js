import { generateCreate } from "./create";
import { generateUpdate } from "./update";
import { generateDestroy } from "./destroy";
import { mapReduce } from "./util";

export const generate = (tree) => {
  const create = mapReduce(tree.children, (child) => generateCreate(child, tree, tree));
  const update = mapReduce(tree.children, (child) => generateUpdate(child, tree, tree));
  const destroy = mapReduce(tree.children, (child) => generateDestroy(child, tree, tree));
  let prelude = "var m0";

  for (let i = 1; i < tree.nextIndex; i++) {
    prelude += `,m${i}`;
  }

  return new Function(`${prelude};return [function(m){m0=m;m=this.m;var data=this.data;${create}},function(){var m=this.m;var data=this.data;${update}},function(){var m=this.m;${destroy}}];`);
};
