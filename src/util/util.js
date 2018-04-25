export const error = (message) => {
  if (Moon.config.silent === false) {
    console.error("[Moon] ERROR: " + message);
  }
};
