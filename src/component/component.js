import { m } from "../util/m";

export const component = (name, view, data) => {
  return function MoonComponent() {
    this.name = name;
    this.data = data();
    this.create = view[0];
    this.mount = view[1];
    this.update = view[2];
    this.m = m();
  };
};
