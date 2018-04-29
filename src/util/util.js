import { config } from "./config";

export const error = (message) => {
  if (config.silent === false) {
    console.error("[Moon] ERROR: " + message);
  }
};

export const mapReduce = (arr, fn) => arr.reduce((result, current) => result + fn(current), "");
