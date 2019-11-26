import { format } from "moon-compiler/src/util";

test("format surrounding lines", () => {
	expect(format(`line one
line 2
line 3`, 10)).toEqual(`1| line one
2| line 2
 |  ^
3| line 3`);
});

test("format large line numbers", () => {
	expect(format("test\n".repeat(1000) + `line one
line 2
line 3`, 5 * 1000 + 10)).toEqual(`1001| line one
1002| line 2
    |  ^
1003| line 3`);
});
