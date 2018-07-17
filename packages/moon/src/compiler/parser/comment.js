export const parseComment = (index, input, length) => {
	while (index < length) {
		const char0 = input[index];
		const char1 = input[index + 1];
		const char2 = input[index + 2];

		if (char0 === "<" && char1 === "!" && char2 === "-" && input[index + 3] === "-") {
			index = parseComment(index + 4, input, length);
		} else if (char0 === "-" && char1 === "-" && char2 === ">") {
			index += 3;
			break;
		} else {
			index += 1;
		}
	}

	return index;
};
