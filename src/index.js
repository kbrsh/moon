import { compile } from "./compiler/compiler";
import { config } from "./util/config";

let components = {};

export default function Moon(root, view) {
  if (typeof root === "string") {
    root = document.querySelector(root);
  }

  if (typeof view === "string") {
    view = compile(view);
  }

  const instance = {
    name: "@",
    data: {},
    create: view[0],
    mount: view[1],
    update: view[2],
    m: []
  };

  instance.create();
  instance.mount(root);
  root.parentNode.removeChild(root);

  return instance;
}

Moon.extend = (name, view, data) => {
  if (typeof view === "string") {
    view = compile(view);
  }

  components[name] = () => {
    return {
      name: name,
      data: data(),
      create: view[0],
      mount: view[1],
      update: view[2],
      m: []
    };
  };
};

Moon.compile = compile;
Moon.config = config;
