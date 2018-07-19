import { config } from "./config";

export const error = (message) => {
	if (config.silent === false) {
		console.error("[Moon] ERROR: " + message);
	}
};
