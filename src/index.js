import { compile } from "./compiler/compiler";
import { config } from "./util/config";

let components = {};

export default function Moon(element, view) {
  if (typeof element === "string") {
    element = document.querySelector(element);
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
  instance.mount();
  element.parentNode.removeChild(element);

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
