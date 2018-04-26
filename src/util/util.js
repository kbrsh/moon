import { config } from "../global/global";

export const error = (message) => {
  if (config.silent === false) {
    console.error("[Moon] ERROR: " + message);
  }
};
