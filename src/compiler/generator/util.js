export const mapReduce = (arr, fn) => arr.reduce((result, current) => result + fn(current), "");

export const attributeValue = (attribute) => attribute.expression ? attribute.value : `"${attribute.value}"`;
