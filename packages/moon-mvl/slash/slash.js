/**
 * Slash
 * Fast, efficient hash
 * Copyright 2017-2018 Kabir Shah
 * Released under the MIT License
 */

const prime = 0xA017132D;

const slash = (key) => {
	let result = 0;

	for (let i = 0; i < key.length; i++) {
		const current = key.charCodeAt(i);
		result = ((result ^ current) * prime) >>> 0;
		result = (result >> 8) | (result << 24);
		result = result >>> 0;
	}

	return result.toString(36);
};
