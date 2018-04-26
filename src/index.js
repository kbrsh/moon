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

  view[0]();
  view[1]();
}

Moon.extend = (name, view, data) => {
  if (typeof view === "string") {
    view = compile(view);
  }

  components[name] = () => {
    return {
      name: name,
      data: data,
      mount: view[0],
      build: view[1],
      m: []
    };
  };
};

Moon.compile = compile;
Moon.config = config;
