import { compile } from "./compiler/compiler";
import { config } from "./util/config";
import { newM } from "./util/m";

let components = {};

export default function Moon(root, view, data) {
  if (typeof root === "string") {
    root = document.querySelector(root);
  }

  if (typeof view === "string") {
    view = compile(view);
  }

  if (data === undefined) {
    data = {};
  }

  const instance = {
    name: "m-root",
    data: data,
    create: view[0],
    mount: view[1],
    update: view[2],
    m: newM()
  };

  instance.create();
  instance.mount(root);

  return instance;
}

Moon.extend = (name, view, data) => {
  if (typeof view === "string") {
    view = compile(view);
  }

  if (data === undefined) {
    data = () => {
      return {};
    };
  }

  components[name] = () => {
    return {
      name: name,
      data: data(),
      create: view[0],
      mount: view[1],
      update: view[2],
      m: newM()
    };
  };
};

Moon.compile = compile;
Moon.config = config;
