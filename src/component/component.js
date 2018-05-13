import { m } from "../util/m";

const set = function (key, value) {
  if (typeof key === "object") {
    for (let childKey in key) {
      this.set(childKey, key[childKey]);
    }
  } else {
    this.data[key] = value;

    if (this.queued === false) {
      this.queued = true;

      const instance = this;
      setTimeout(() => {
        instance.update();
        instance.queued = false;
      }, 0);
    }
  }
};

export const component = (name, view, data) => {
  return function MoonComponent() {
    this.name = name;
    this.data = data();
    this.queued = false;
    this.create = view[0];
    this.mount = view[1];
    this.update = view[2];
    this.set = set;
    this.m = m();

    let actions = this.data.actions;
    for (let action in actions) {
      actions[action] = actions[action].bind(this);
    }
  };
};
