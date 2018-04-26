export const config = {
  silent: (process.env.MOON_ENV === "production") || (typeof console === "undefined")
};

export const createGlobal = (Moon) => {
  Moon.config = config;
};
