import { compile } from "./compiler/compiler";
import { component } from "./component/component";
import { components } from "./component/components";
import { config } from "./util/config";

export default function Moon(options) {
  let root = options.root;
  if (typeof root === "string") {
    root = document.querySelector(root);
  }

  let view = options.view;
  if (typeof view === "string") {
    options.view = compile(view);
  }

  let data = options.data;
  if (data === undefined) {
    options.data = () => {
      return {};
    };
  } else if (typeof data === "object") {
    options.data = () => data;
  }

  let actions = options.actions;
  if (actions === undefined) {
    options.actions = {};
  }

  const instanceComponent = component("#m", options);
  const instance = new instanceComponent();

  instance.create(root);

  return instance;
}

Moon.extend = (name, options) => {
  let view = options.view;
  if (typeof view === "string") {
    options.view = compile(view);
  }

  let data = options.data;
  if (data === undefined) {
    options.data = () => {
      return {};
    };
  }

  let actions = options.actions;
  if (actions === undefined) {
    options.actions = {};
  }

  components[name] = component(name, options);
};

Moon.compile = compile;
Moon.config = config;
