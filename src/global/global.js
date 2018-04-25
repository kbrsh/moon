Moon.config = {
  silent: (process.env.MOON_ENV === "production") || (typeof console === "undefined")
};
