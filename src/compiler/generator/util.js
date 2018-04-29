export const mapReduce = (arr, fn) => arr.reduce((result, current) => result + fn(current), "");
