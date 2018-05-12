import { compile } from "./compiler/compiler";
import { component } from "./component/component";
import { config } from "./util/config";

let components = {};

export default function Moon(root, view, data) {
  if (typeof root === "string") {
    root = document.querySelector(root);
  }

  if (typeof view === "string") {
    view = compile(view);
  }

  if (data === undefined) {
    data = () => { return {}; };
  } else if (typeof data === "object") {
    let dataObj = data;
    data = () => dataObj;
  }

  const rootComponent = component("m-root", view, data);
  const instance = new rootComponent();

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

  components[name] = component(name, view, data);
};

Moon.compile = compile;
Moon.config = config;
